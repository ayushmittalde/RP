# Infrastructure Analysis — AutoGPT Test Suite

**Analysis Date**: February 22, 2026  
**Purpose**: Document existing test infrastructure to ensure generated tests align with established patterns  
**Previous Analysis**: February 18, 2026 (superseded)

---

## 1. Test File Structure & Patterns

### 1.1 Test Directory Structure
```
AutoGPT/tests/
├── *.spec.ts                   (root-level test files)
├── pages/                      (Page Object Models)
│   ├── base.page.ts
│   ├── build.page.ts
│   ├── header.page.ts
│   ├── library.page.ts
│   ├── login.page.ts
│   ├── marketplace.page.ts
│   ├── monitor.page.ts
│   ├── navbar.page.ts
│   ├── profile-form.page.ts
│   └── profile.page.ts
├── utils/                      (helper utilities)
│   ├── assertion.ts
│   ├── auth.ts
│   ├── get-browser.ts
│   ├── selectors.ts
│   ├── signin.ts
│   └── signup.ts
├── credentials/
│   └── index.ts                (TEST_CREDENTIALS + getTestUserWithLibraryAgents)
├── assets/                     (test assets)
├── integrations/               (integration helpers)
├── global-setup.ts             (global test setup — creates user pool)
├── feature_delete_agent/       (delete agent feature tests)
│   ├── delete-agent.spec.ts
│   └── coverage-report.md
└── feature_edit_agent/         (edit agent feature tests)
    ├── edit-agent.spec.ts
    └── coverage-report.md
```

### 1.2 Test File Naming Convention
- Pattern: `<feature-name>.spec.ts`
- Feature directories: `feature_<feature_name>/`
- TypeScript ONLY (`.ts` extension)

---

## 2. Import Patterns (MANDATORY)

### 2.1 Standard Test Imports
```typescript
import test, { expect, BrowserContext, Page } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { LibraryPage } from "../pages/library.page";
import { BuildPage } from "../pages/build.page";
import { MonitorPage } from "../pages/monitor.page";
import { getTestUser } from "../utils/auth";
import { hasUrl } from "../utils/assertion";
import { getSelectors } from "../utils/selectors";
```

### 2.2 Critical Rules
- **NEVER** use `page.locator()` directly in test assertions
- **ALWAYS** use `getSelectors(page)` for element selection
- **ALWAYS** use Page Object Methods for interactions
- Import from relative paths: `../pages/`, `../utils/`

---

## 3. Selector Patterns (NON-NEGOTIABLE)

### 3.1 getSelectors() API
```typescript
const { getId, getButton, getText, getRole, getLink } = getSelectors(page);

// Examples:
getId("library-agent-card")         // Get by data-testid
getButton("More actions")           // Get button by name  
getText("Are you sure")             // Get text element
getRole("menuitem", "Edit agent")   // Get by role and name
```

### 3.2 Available Selector Methods
- `getId(testid)` — Get by data-testid (exact or regex)
- `getButton(name)` — Get button by accessible name
- `getText(name)` — Get by text content
- `getLink(name)` — Get link by name
- `getField(name)` — Get form field by label
- `getRole(role, name, options)` — Get by ARIA role

### 3.3 Forbidden Patterns
❌ `page.locator(".class")`  
❌ `page.locator("#id")`  
❌ `page.locator("button")`  
✅ `getSelectors(page).getButton("Button Name")`  
✅ `getSelectors(page).getId("data-testid")`

### 3.4 Selector Convention Mapping (CRITICAL — Updated Feb 22, 2026)

**Purpose:** This mapping table is the ONLY permitted reference for translating playwright-cli generated code to getSelectors() equivalents.

**Source:** Based on `AutoGPT/tests/utils/selectors.ts` full source code analysis.

| playwright-cli Generated | getSelectors() Equivalent | Notes |
|-------------------------|---------------------------|-------|
| `page.getByRole('button', { name: 'Save' })` | `getButton('Save')` | Exact name match |
| `page.getByRole('button', { name: /skip/i })` | `getButton(/skip/i)` | Regex supported |
| `page.getByText('Welcome')` | `getText('Welcome')` | Exact text by default |
| `page.getByText('Welcome', { exact: false })` | `getText('Welcome', { exact: false })` | Pass options |
| `page.getByRole('link', { name: 'Home' })` | `getLink('Home')` | Links by name |
| `page.getByLabel('Email')` | `getField('Email')` | Form fields by label (exact: true) |
| `page.getByTestId('agent-card')` | `getId('agent-card')` | data-testid attribute |
| `page.getByTestId(/agent-card-\d+/)` | `getId(/agent-card-\d+/)` | Regex for testid |
| `page.getByRole('menuitem', { name: 'Edit' })` | `getRole('menuitem', 'Edit')` | Any role with name |
| `page.getByRole('dialog')` | `getRole('dialog')` | Role without name |
| `page.getByRole('heading', { level: 5 })` | `getRole('heading', undefined, { level: 5 })` | Role with options |

**RULE:** No selector may be written in any test that does not appear in this table or was not directly emitted by playwright-cli during Phase 5a exploration.

**Validation Method:** Before committing any selector, verify it matches an entry in this table OR was captured verbatim from playwright-cli output.

---

## 4. Page Object Model Architecture

### 4.1 BasePage Structure
```typescript
export class BasePage {
  readonly navbar: NavBar;
  readonly downloadsFolder = "./.test-contents";
  constructor(protected page: Page) {
    this.navbar = new NavBar(page);
  }
}
```

### 4.2 Existing Page Objects

#### LoginPage
- `login(email, password)` — standard login

#### LibraryPage
- `isLoaded()` — wait for library to be ready
- `getAgents()` — returns `Agent[]` (id, name, description, seeRunsUrl, openInBuilderUrl)
- `getAgentCount()` — badge number from `data-testid="agents-count"`
- `agentExists(name)` — checks for card by name
- `openAgentActions(agentName)` — clicks "More actions" on agent card
- `clickDeleteAgentMenuItem()` — empirically verified
- `confirmDeleteAgent()` / `cancelDeleteAgent()` — dialog buttons
- `deleteAgent(agentName)` — full delete flow
- **`clickEditAgentMenuItem()`** — "Edit agent" in More actions → NEW TAB (added 2026-02-18)
- **`clickDuplicateAgentMenuItem()`** — "Duplicate agent" in More actions (added 2026-02-18)
- **`clickOpenInBuilderLink(agentName)`** — direct "Open in builder" link → SAME TAB (added 2026-02-18)
- **`getOpenInBuilderHref(agentName)`** — returns href from Open in builder link (added 2026-02-18)
- **`isEditAgentMenuItemVisible()`** — checks if Edit agent menuitem is visible (added 2026-02-18)
- **`isDuplicateAgentMenuItemVisible()`** — checks if Duplicate agent menuitem visible (added 2026-02-18)
- `clickOpenInBuilder(agent)` — older method using Agent object

#### BuildPage
- `closeTutorial()` — dismisses tutorial dialog
- `saveAgent(name, description)` — clicks save, fills dialog, saves
- `createDummyAgent()` — creates minimal agent with a Dictionary block
- `addBlock(block)` — adds a block to the canvas (searches, clicks block card)
- `getBlocksFromAPI()` — fetches available blocks from API
- `getFilteredBlocksFromAPI(filterFn)` — gets blocks matching filter function
- `openBlocksPanel()` — opens the blocks panel
- `closeBlocksPanel()` — closes the blocks panel
- `fillBlockInputByPlaceholder(blockId, placeholder, value, dataId?)` — fills block input by placeholder
- `fillBlockInputByLabel(blockId, label, value)` — fills block input by label
- `selectBlockInputValue(blockId, inputName, value, dataId?)` — selects dropdown value
- `connectBlockOutputToBlockInputViaName(...)` — connects blocks by output/input names
- `connectBlockOutputToBlockInputViaDataId(...)` — connects blocks by data-ids
- `runAgent()` — clicks run button
- `fillRunDialog(inputs)` — fills run dialog inputs
- `clickRunDialogRunButton()` — clicks run button in dialog
- `waitForCompletionBadge()` — waits for COMPLETED badge
- `getBlockById(blockId, dataId?)` — gets block locator
- **NOTE:** Block interactions require understanding of data-testid patterns and block structure

#### MonitorPage
- `isLoaded()`, `listAgents()`, `clickAgent(id)`, `deleteAgent(agent, confirm)`
- `ensureAgentExists(name?)`, `ensureExactAgentCount(count)`, `ensureZeroAgents()`
- **⚠️ WARNING**: Clicking an agent in Monitor Tab causes an ERROR PAGE. Do NOT navigate to agent detail from Monitor Tab.

#### NavBar
- `clickBuildLink()`, `clickLibraryLink()`, `clickMarketplaceLink()`

---

## 5. Authentication Pattern (MANDATORY)

### 5.1 Standard Auth Flow
```typescript
test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  const testUser = await getTestUser();
  
  await page.addInitScript(() => {
    window.localStorage.setItem("autogpt_cookie_consent",
      JSON.stringify({ hasConsented: true, timestamp: Date.now(), analytics: true, monitoring: true }));
  });
  
  await page.goto("/login");
  await loginPage.login(testUser.email, testUser.password);
  await hasUrl(page, /\/(marketplace|library|onboarding.*)?/);
});
```

### 5.2 Authentication Utilities
- `getTestUser()` — Gets next test user from pool at `.auth/user-pool.json`
- `createTestUser()` — Creates new test user
- `getTestUserWithLibraryAgents()` — Gets specific user from `credentials/index.ts`

### 5.3 User Pool Location
- `d:\RP\.auth\user-pool.json` (11 users as of Feb 2026)

---

## 6. Test Structure Patterns

### 6.1 Standard Test Structure
```typescript
test.describe("Feature Name", () => {
  let featurePage: FeaturePage;
  
  test.beforeEach(async ({ page }) => { /* auth */ });
  
  /**
   * Test Case ID: TC-###
   * Covered Requirements: FR-1, FR-2
   * Test Type: Happy Path | Negative | Edge Case
   * Preconditions Established: State creation method
   */
  test("TC-###: description", async ({ page, context }) => {
    // ARRANGE — ACT — ASSERT
  });
});
```

### 6.2 New Tab Handling Pattern (CRITICAL)
When an action opens a new browser tab:
```typescript
const newPagePromise = context.waitForEvent("page");
await libraryPage.clickEditAgentMenuItem(); // opens new tab
const builderPage = await newPagePromise;
await builderPage.waitForLoadState("domcontentloaded");
// ... assertions on builderPage ...
await builderPage.close(); // prevent tab leaks
```

### 6.3 Agent Creation Helper
```typescript
async function createTestAgent(page: Page, name: string, desc = "..."): Promise<string> {
  await page.goto("/build");
  await page.waitForLoadState("domcontentloaded");
  const buildPage = new BuildPage(page);
  await buildPage.closeTutorial();
  await buildPage.saveAgent(name, desc);
  await page.waitForURL(/\/build\?flowID=/, { timeout: 15_000 });
  return name;
}
```

---

## 7. Key Application Selectors (Empirically Verified Feb 18, 2026)

### 7.1 Library Page (`/library`)
| Element | Selector Strategy |
|---------|------------------|
| Agent card | `data-testid="library-agent-card"` |
| Agent name heading | `heading [level=5]` within card |
| More actions button | `role="button" name="More actions"` within card |
| Edit agent menuitem | `role="menuitem" name="Edit agent"` |
| Duplicate agent menuitem | `role="menuitem" name="Duplicate agent"` |
| Delete agent menuitem | `role="menuitem" name="Delete agent"` |
| Open in builder link | `data-testid="library-agent-card-open-in-builder-link"` |
| See runs link | `data-testid="library-agent-card-see-runs-link"` |
| Agent count badge | `data-testid="agents-count"` |

### 7.2 Agent Detail Page (`/library/agents/<id>`)
| Element | Selector Strategy |
|---------|------------------|
| Edit agent button | `role="button" name="Edit agent"` (contains link, opens NEW TAB) |
| Export agent | `role="button" name="Export agent to file"` |
| Delete agent | `role="button" name="Delete agent"` |

### 7.3 Builder (`/build?flowID=<id>&flowVersion=<n>`)
| Element | Selector Strategy |
|---------|------------------|
| Save button | `data-testid="blocks-control-save-button"` |
| Name input | `data-testid="save-control-name-input"` (pre-fills existing name) |
| Description input | `data-testid="save-control-description-input"` (pre-fills existing desc) |
| Save dialog button | `data-testid="save-control-save-agent-button"` |
| Tutorial skip | `role="button" name="Skip Tutorial"` |

### 7.4 Delete Confirmation Dialog
| Element | Selector Strategy |
|---------|------------------|
| Dialog | `role="dialog" name="Delete agent"` |
| Confirm | `role="button" name="Delete Agent"` |
| Cancel | `role="button" name="Cancel"` |
| Close X | `role="button" name="Close"` |

---

## 8. Application Entry Points

| Route | Description | Notes |
|-------|-------------|-------|
| `/login` | Login page | |
| `/marketplace` | Post-login redirect | |
| `/library` | Library page | Redirects to `?sort=updatedAt` |
| `/library/agents/<id>` | Agent detail | Redirects to `?activeTab=runs` |
| `/build` | New agent | Tutorial dialog on first load |
| `/build?flowID=<uuid>` | Edit agent (Open in builder) | No flowVersion |
| `/build?flowID=<uuid>&flowVersion=<n>` | Edit agent (Edit action) | With version |
| `/monitoring` | Monitor Tab | ⚠️ Agent click causes error page |

---

## 9. Discovered Application Behaviors (Empirical, Feb 18 2026)

| Behavior | Details |
|----------|---------|
| "Edit agent" (More actions) | Opens NEW TAB with builder at `/build?flowID=<id>&flowVersion=<n>` |
| "Edit agent" (detail page) | Opens NEW TAB with builder at `/build?flowID=<id>&flowVersion=<n>` |
| "Open in builder" (card link) | Navigates SAME TAB to `/build?flowID=<id>` |
| Save increments flowVersion | After save: `flowVersion=1` → `flowVersion=2` |
| Save dialog pre-fills | Name + description filled from persisted agent data |
| Monitor Tab agent click | ERROR PAGE — "Something went wrong" (broken) |
| Post-login redirect | URL becomes `/marketplace` |
| Library sort param | `?sort=updatedAt` appended automatically |

---

## 10. Configuration

### 10.1 Playwright Config
- Test dir: `./AutoGPT/tests`
- Base URL: `http://localhost:3000/`
- Timeout: 25000ms
- Global setup: `./AutoGPT/tests/global-setup.ts`
- Parallel: `fullyParallel: true`
- Browser: Chromium only

### 10.2 Validation Command
```bash
npx playwright test --list
```

---

## 11. Generated Test Suites

| Suite | Location | Last Updated |
|-------|----------|-------------|
| Delete Agent | `feature_delete_agent/delete-agent.spec.ts` | Feb 18, 2026 |
| Edit Agent | `feature_edit_agent/edit-agent.spec.ts` | Feb 18, 2026 |
| Agent Blocks | `feature_agent_blocks/` | Feb 22, 2026 (in progress) |

---

## 12. Agent Blocks Feature Notes (Added Feb 22, 2026)

### 12.1 Key Concepts
- **Agent Blocks**: Saved agents that can be reused as blocks in other workflows
- **Block Menu**: The panel where users search and add blocks (including agent blocks) to canvas
- **Input/Output Blocks**: Special blocks that define the interface of an agent block
- **Block Connections**: Visual connections between block outputs and inputs

### 12.2 Critical Requirements for Testing
- Must be able to add Input Block, AI Text Generator Block, Output Block
- Must be able to connect blocks (output → input)
- Must be able to name Input and Output blocks (defines agent block interface)
- Must save agent and verify it appears in Block Menu
- Must be able to search for and add saved agent as a block
- Must verify agent block execution produces correct outputs

### 12.3 Anticipated Test Challenges
- **Block identification**: Blocks may need unique data-id or data-blockid attributes
- **Connection verification**: Need to verify visual connections exist
- **Block naming**: Need to locate and edit block name fields
- **Block Menu search**: Need to search and filter agent blocks by name/tag
- **Nested workflows**: Agent blocks within agent blocks (hierarchical composition)
- **Output display**: Results shown in "Agent Outputs" section or via "View More"

### 12.4 Exploration Required
- How are Input/Output blocks different from other blocks?
- Where is the block name field located?
- How does Block Menu search work?
- What are "agent tags" mentioned in requirements?
- How are agent blocks distinguished from regular blocks in Block Menu?
- What happens when Output Block is missing (EC-01)?

---

**End of Infrastructure Analysis**
