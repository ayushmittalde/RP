# Infrastructure Analysis — Delete Agent Feature

**Date:** 2025-02-23  
**Feature:** Delete Agent (AutoGPT Platform)  
**Analyst:** GitHub Copilot (Claude Opus 4.6)

---

## 1. Test Framework & Configuration

### Playwright Config (`playwright.config.ts`)
- **Test Dir:** `./AutoGPT/tests`
- **Global Setup:** `./AutoGPT/tests/global-setup.ts` — creates user pool via signup
- **Base URL:** `http://localhost:3000/`
- **Browser:** Chromium only (project: `chromium`)
- **Timeout:** 25000ms per test
- **Parallel:** `fullyParallel: true`
- **Web Server:** `pnpm start` on `http://localhost:3000`
- **Storage State:** Auto-accepts cookies via localStorage (`autogpt_cookie_consent`)
- **Reporter:** list + HTML + JSON
- **Screenshot:** only-on-failure
- **Trace:** on-first-retry
- **Video:** retain-on-failure

### Global Setup (`global-setup.ts`)
- Loads existing user pool from `.auth/user-pool.json`
- If no pool exists, creates `workers + 8` test users via signup page
- Uses `createTestUsers()` from `utils/auth.ts`

---

## 2. Infrastructure Inventory

### utils/
| File | Purpose |
|------|---------|
| `selectors.ts` | `getSelectors(page)` — canonical selector factory |
| `auth.ts` | `getTestUser()`, `createTestUser()`, user pool management |
| `signin.ts` | `SigninUtils` — login/logout/verify helpers |
| `signup.ts` | `signupTestUser()` — user creation via signup page |
| `assertion.ts` | `isVisible`, `hasUrl`, `isHidden`, `hasAttribute`, etc. |
| `get-browser.ts` | Browser launcher utility |

### pages/
| File | Class | Key Methods |
|------|-------|-------------|
| `base.page.ts` | `BasePage` | `navbar` (NavBar instance) |
| `navbar.page.ts` | `NavBar` | `clickMonitorLink()`, `clickBuildLink()`, `clickMarketplaceLink()`, `logout()`, `isLoggedIn()` |
| `login.page.ts` | `LoginPage` | `login(email, password)`, `goto()` |
| `monitor.page.ts` | `MonitorPage` | `isLoaded()`, `listAgents()`, `clickAgent(id)`, `clickTrashIcon(agent)`, `hasDeleteConfirmationDialog()`, `confirmDeletion()`, `cancelDeletion()`, `deleteAgent(agent, confirm)`, `ensureAgentExists()`, `ensureExactAgentCount(n)`, `ensureZeroAgents()`, `importFromFile()`, `exportToFile()` |
| `build.page.ts` | `BuildPage` | `closeTutorial()`, `saveAgent()`, `createDummyAgent()`, `runAgent()` |
| `library.page.ts` | `LibraryPage` | `navigateToLibrary()`, `searchAgents()`, agent card utilities |

### credentials/
| File | Contents |
|------|----------|
| `index.ts` | `TEST_CREDENTIALS` (test123@gmail.com), `getTestUserWithLibraryAgents()` |

### assets/
- Test asset files (not relevant for delete agent)

---

## 3. Selector Strategy — `getSelectors(page)` API

### Method Signatures

```typescript
function getSelectors(page: Page) {
  return {
    getButton: (name: string | RegExp, locator?: Locator) => Locator,
    getText: (name: string | RegExp, options?: GetByTextOptions) => Locator,
    getLink: (name: string | RegExp, locator?: Locator) => Locator,
    getField: (name: string | RegExp, locator?: Locator) => Locator,
    getId: (testid: string | RegExp, locator?: Locator) => Locator,
    within: (testid: string) => Locator,
    getRole: (role: Roles, name?: string | RegExp, options?: GetByRoleOptions & { within?: Locator }) => Locator,
  };
}
```

### Mapping Details

| Method | Underlying Playwright Call |
|--------|--------------------------|
| `getButton(name)` | `page.getByRole('button', { name })` |
| `getText(name, opts)` | `page.getByText(name, opts)` |
| `getLink(name)` | `page.getByRole('link', { name })` |
| `getField(name)` | `page.getByLabel(name, { exact: true })` |
| `getId(testid)` | `page.getByTestId(testid)` |
| `within(testid)` | `page.locator('data-testid=testid')` |
| `getRole(role, name, opts)` | `page.getByRole(role, { name, ...opts })` |

---

## 4. Selector Convention Mapping Table

This table maps raw Playwright calls to `getSelectors()` equivalents.

| Raw Playwright Code | getSelectors Equivalent |
|---------------------|------------------------|
| `page.getByRole('button', { name: 'Login' })` | `getButton('Login')` |
| `page.getByRole('button', { name: /delete/i })` | `getButton(/delete/i)` |
| `page.getByRole('link', { name: 'Create' })` | `getLink('Create')` |
| `page.getByText('Are you sure')` | `getText('Are you sure')` |
| `page.getByTestId('monitor-page')` | `getId('monitor-page')` |
| `page.getByTestId('delete-agent-button')` | `getId('delete-agent-button')` |
| `page.getByLabel('Email')` | `getField('Email')` |
| `page.getByRole('dialog')` | `getRole('dialog')` |
| `page.getByRole('row', { name: /agent-name/ })` | `getRole('row', /agent-name/)` |

> **NOTE:** Will be updated with empirical findings from Phase 4a exploration.

---

## 5. Authentication Flow

1. Test users are pre-created during global setup → saved in `.auth/user-pool.json`
2. `getTestUser()` loads a random user from the pool
3. Login pattern in tests:
   ```typescript
   const loginPage = new LoginPage(page);
   const testUser = await getTestUser();
   await page.goto("/login");
   await loginPage.login(testUser.email, testUser.password);
   await hasUrl(page, "/marketplace");
   ```
4. After login, navigate to target page (e.g., `/monitoring`)

---

## 6. MonitorPage — Delete-Related Methods (Pre-existing)

The `MonitorPage` class already has delete-related methods with **TODO** markers indicating selectors are assumed, not verified:

- `clickTrashIcon(agent)` — tries multiple strategies: `getByTestId('delete-agent-button')`, `getByRole('button', { name: /delete|trash|remove/i })`, then within agent row
- `hasDeleteConfirmationDialog()` — tries `getByRole('dialog')` and `getByTestId('delete-confirmation-dialog')`
- `confirmDeletion()` — tries `getByRole('button', { name: /yes.*delete|confirm|delete/i })`, `getByTestId('confirm-delete-button')`, then `getByText(/yes.*delete/i)`
- `cancelDeletion()` — tries `getByRole('button', { name: /cancel|no/i })`, `getByTestId('cancel-delete-button')`, then Escape key
- `deleteAgent(agent, confirm)` — orchestrates clickTrashIcon + confirm/cancel
- `ensureAgentExists(name?)` — creates agent if needed via Build page
- `ensureExactAgentCount(n)` — adjusts agent count
- `ensureZeroAgents()` — deletes all agents

> **IMPORTANT:** All delete-related selectors in MonitorPage are marked TODO and need verification via exploration.

---

## 7. Test Pattern (from `monitor.spec.ts`)

```typescript
test.describe.configure({ mode: "parallel", timeout: 30000 });

test.beforeEach(async ({ page }, testInfo) => {
  const loginPage = new LoginPage(page);
  const testUser = await getTestUser();
  const monitorPage = new MonitorPage(page);
  
  await page.goto("/login");
  await loginPage.login(testUser.email, testUser.password);
  await hasUrl(page, "/marketplace");
  
  // Navigate to monitoring page
  await page.goto("/monitoring");
  await test.expect(monitorPage.isLoaded()).resolves.toBeTruthy();
});
```

---

## 8. Key Application Routes

| Route | Page |
|-------|------|
| `/login` | Login page |
| `/signup` | Signup page |
| `/marketplace` | Marketplace (default after login) |
| `/monitoring` | Monitor Tab (agent list) |
| `/build` | Build page (agent builder) |
| `/library` | Library page |

---

## 9. Pages/Views for Delete Agent Feature

1. **Monitor Tab** (`/monitoring`) — agent list, selection, trash icon, deletion
2. **Build Page** (`/build`) — agent creation (precondition setup)
3. **Login Page** (`/login`) — authentication (precondition)

---

## 10. Exploration Readiness

- [x] Playwright config verified
- [ ] Application running at localhost:3000 (will verify)
- [ ] Browser can launch in headed mode (will verify with playwright-cli)
- [ ] User pool exists (will verify)

> **Next Step:** Phase 4a — Use `playwright-cli` to explore the actual system and verify all selectors.
