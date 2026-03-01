# Infrastructure Analysis — AutoGPT E2E (Delete Agent)

- Date: 2026-02-23
- Scope: Phase 0 mandatory infrastructure analysis for delete-agent feature derivation
- Trigger: `Resources/references/infrastructure-analysis.md` was missing, so full Phase 0 was executed

## 1) Test Infrastructure Inventory

### Active test root
- `playwright.config.ts` sets `testDir: "./AutoGPT/tests"` and `globalSetup: "./AutoGPT/tests/global-setup.ts"`.
- `baseURL` is `http://localhost:3000/`.

### Required infrastructure present in active tree (`AutoGPT/tests`)
- `utils/`
  - `selectors.ts`
  - `auth.ts`
  - `signin.ts`
  - `signup.ts`
  - `assertion.ts`
  - `get-browser.ts`
- `pages/`
  - `base.page.ts`
  - `login.page.ts`
  - `monitor.page.ts`
  - `navbar.page.ts`
  - `build.page.ts`
  - `library.page.ts`
  - `marketplace.page.ts`
  - `profile.page.ts`
  - `profile-form.page.ts`
- `credentials/`
  - `index.ts`
- `assets/`
  - `testing_agent.json`
- Other required files
  - `AutoGPT/tests/global-setup.ts`
  - `playwright.config.ts`

### Mirror tree note
- `Resources/tests` mirrors `AutoGPT/tests`, but Playwright configuration executes from `AutoGPT/tests`.

## 2) Authentication Strategy (Required)

- Auth helpers:
  - `getTestUser()` from `AutoGPT/tests/utils/auth.ts` (reads `.auth/user-pool.json`)
  - `LoginPage` from `AutoGPT/tests/pages/login.page.ts`
- Existing flow pattern in specs:
  1. `page.goto("/login")`
  2. `loginPage.login(testUser.email, testUser.password)`
  3. assert landing route (typically `/marketplace`)
- Supporting state:
  - `.auth/user-pool.json` exists and contains valid users.

## 3) Selector Convention (CRITICAL)

All new selectors for generated tests must use `getSelectors(page)`.

Source: `AutoGPT/tests/utils/selectors.ts`

### Exact available selector methods
- `getButton(name: string | RegExp, locator?: Locator): Locator`
- `getText(name: string | RegExp, options?: GetByTextOptions): Locator`
- `getLink(name: string | RegExp, locator?: Locator): Locator`
- `getField(name: string | RegExp, locator?: Locator): Locator`
- `getId(testid: string | RegExp, locator?: Locator): Locator`
- `within(name: string): Locator` (data-testid scoped locator)
- `getRole(role: Roles, name?: string | RegExp, options?: GetByRoleOptions & { within?: Locator }): Locator`

### Internal mapping behavior
- `getButton` -> `getByRole("button", { name })`
- `getField` -> `getByLabel(name, { exact: true })`
- `getId` -> `getByTestId(testid)`
- `getLink` -> `getByRole("link", { name })`
- `getText` -> `getByText(name, options)`
- `getRole` -> generic `getByRole(role, { ...options, ...(name ? { name } : null) })`

## 4) Empirical Selector Convention Mapping (Playwright CLI)

Representative actions were executed with `playwright-cli` in live app session; generated code was captured.

| Playwright-CLI Generated Line | `getSelectors(page)` Equivalent | Notes |
|---|---|---|
| `await page.getByRole('button', { name: 'Accept All' }).click();` | `await getButton("Accept All").click();` | Cookie banner gate on `/login` |
| `await page.getByRole('textbox', { name: 'Email' }).fill('...');` | `await getRole("textbox", "Email").fill("...");` | Prefer `getRole` because CLI emitted role locator |
| `await page.getByRole('textbox', { name: 'Password Forgot password?' }).fill('...');` | `await getRole("textbox", /Password Forgot password\?/).fill("...");` | Accessible name includes helper text |
| `await page.getByRole('button', { name: 'Login' }).click();` | `await getButton("Login").click();` | Deterministic on login page |
| `await page.getByTestId('agent-activity-button').click();` | `await getId("agent-activity-button").click();` | Validated on marketplace/monitor nav cluster |
| `await page.getByRole('button', { name: 'Close wallet' }).click();` | `await getButton("Close wallet").click();` | Wallet dialog can overlay nav |
| `await page.getByTestId('create-agent-dropdown').click();` | `await getId("create-agent-dropdown").click();` | Monitoring page control |
| `await page.getByTestId('import-agent-from-file').click();` | `await getId("import-agent-from-file").click();` | Monitoring create menu item |
| `await page.getByTestId('import-agent-file-input').click();` | `await getId("import-agent-file-input").click();` | Opens file chooser |
| `await fileChooser.setFiles([".\\AutoGPT\\tests\\assets\\testing_agent.json"])` | N/A (file chooser API; no selector wrapper) | Keep as Playwright native action |
| `await page.getByRole('button', { name: 'Close' }).click();` | `await getButton("Close").click();` | Import dialog close |
| `await page.getByTestId('573bf1bd-9766-4726-96d5-6be972fd49c7').click();` | `await getId("573bf1bd-9766-4726-96d5-6be972fd49c7").click();` | Row selection reproduces app error |

## 5) Page Objects Review (Reuse / Extend)

### Existing objects relevant to feature
- `LoginPage`
  - `goto()`
  - `login(email, password)`
- `MonitorPage`
  - `isLoaded()`
  - `listAgents()`
  - `clickAgent(id)`
  - has delete helpers, but several contain TODO/assumed selector strategies and are not fully empirical.
- `NavBar`
  - `clickBuildLink()`, `clickMarketplaceLink()`, etc.
  - `clickMonitorLink()` currently points to `navbar-link-library` (not a monitor route), so monitor navigation should not rely on this method without correction.

### Reuse decision for delete-agent synthesis
- Reuse `LoginPage` + `getTestUser()`.
- For delete-agent test synthesis, prefer direct `getSelectors(page)` + empirically captured selectors over non-validated `MonitorPage` delete helper methods.

## 6) Exploration Environment Readiness

- `playwright-cli` available: `1.59.0-alpha-1771104257000`
- Headed mode verified:
  - Command: `playwright-cli open http://localhost:3000/login --headed`
  - Browser metadata reported `headed: true`
- Entry points confirmed during exploration:
  - `/login`
  - `/marketplace`
  - `/monitoring`

## 7) Pages / Views to Explore for Delete-Agent

- Login view (`/login`)
- Marketplace shell (for post-login shell behavior)
- Monitoring view (`/monitoring`) — primary target for delete-agent flow
- Import dialog in monitoring (state construction path)
- Error boundary state after agent row selection (observed during exploration)

## 8) Hard Rules for Test Authoring

1. No selectors may be authored outside this mapping table or Phase 4a code-bank captures.
2. No direct `page.locator()` usage in generated delete-agent tests.
3. Assertions must come from snapshot observations, not requirement text assumptions.
4. Any scenario blocked by unrecoverable empirical behavior must be marked BLOCKED, not fabricated.