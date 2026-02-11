# Infrastructure Analysis - Delete Agent Test Suite

**Analysis Date**: February 8, 2026  
**Purpose**: Document existing test infrastructure to ensure generated tests align with established patterns

---

## 1. Test File Structure & Patterns

### 1.1 Test Directory Structure
```
AutoGPT/tests/
├── *.spec.ts (test files)
├── pages/ (Page Object Models)
├── utils/ (helper utilities)
├── credentials/ (test user data)
├── assets/ (test assets)
├── integrations/ (integration helpers)
├── global-setup.ts (global test setup)
└── delete-agent/ (empty - to be populated)
```

### 1.2 Test File Naming Convention
- Pattern: `<feature-name>.spec.ts`
- Examples: `monitor.spec.ts`, `library.spec.ts`, `build.spec.ts`
- TypeScript ONLY (`.ts` extension)

---

## 2. Import Patterns (MANDATORY)

### 2.1 Standard Test Imports
```typescript
import test, { expect, TestInfo } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { MonitorPage } from "./pages/monitor.page"; // or relevant page
import { getTestUser } from "./utils/auth";
import { hasUrl } from "./utils/assertion";
import { getSelectors } from "./utils/selectors";
```

### 2.2 Critical Rules
- **NEVER** use `page.locator()` directly
- **ALWAYS** use `getSelectors(page)` for element selection
- **ALWAYS** use Page Object Methods for interactions
- Import from relative paths: `./pages/`, `./utils/`

---

## 3. Selector Patterns (NON-NEGOTIABLE)

### 3.1 getSelectors() API
```typescript
const { getId, getButton, getText, getRole } = getSelectors(page);

// Examples:
getId("monitor-page")           // Get by test-id
getButton("Yes, delete")        // Get button by name
getText("Are you sure")         // Get text element
getRole("button", "Cancel")     // Get by role and name
```

### 3.2 Available Selector Methods
- `getId(testid)` - Get by data-testid
- `getButton(name)` - Get button by accessible name
- `getText(name)` - Get by text content
- `getLink(name)` - Get link by name
- `getField(name)` - Get form field by label
- `getRole(role, name, options)` - Get by ARIA role

### 3.3 Forbidden Patterns
❌ `page.locator(".class")`  
❌ `page.locator("#id")`  
❌ `page.locator("button")`  
✅ `getSelectors(page).getButton("Button Name")`

---

## 4. Page Object Model (POM) Architecture

### 4.1 BasePage Structure
All Page Objects extend `BasePage`:
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
- `LoginPage` - Authentication
- `MonitorPage` - Monitor Tab interactions
- `LibraryPage` - Library page interactions
- `BuildPage` - Build page interactions
- `NavBar` - Navigation component
- `MarketplacePage` - Marketplace interactions

### 4.3 MonitorPage Current Methods
```typescript
class MonitorPage extends BasePage {
  async isLoaded(): Promise<boolean>
  async listAgents(): Promise<Agent[]>
  async listRuns(filter?: Agent): Promise<Run[]>
  async clickAgent(id: string): Promise<void>
  async importFromFile(...): Promise<void>
  async exportToFile(agent: Agent): Promise<void>
  async deleteAgent(agent: Agent): Promise<void> // ⚠️ STUB - NOT IMPLEMENTED
}
```

**CRITICAL FINDING**: `MonitorPage.deleteAgent()` exists but is **EMPTY** - only logs to console. This MUST be implemented.

---

## 5. Authentication Pattern (MANDATORY)

### 5.1 Standard Auth Flow
```typescript
test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  const testUser = await getTestUser(); // Gets user from pool
  
  await page.goto("/login");
  await loginPage.login(testUser.email, testUser.password);
  await hasUrl(page, "/marketplace");
});
```

### 5.2 Authentication Utilities
- `getTestUser()` - Gets test user from pre-created pool
- `createTestUser()` - Creates new test user
- `getTestUserWithLibraryAgents()` - Gets user with existing library agents

### 5.3 Global Setup
- `global-setup.ts` creates user pool before tests
- Workers = N users + 8 buffer
- User pool persisted across test runs
- Auto-accept cookies via localStorage

---

## 6. Test Structure Patterns

### 6.1 Standard Test Structure
```typescript
test.describe("Feature Name", () => {
  let featurePage: FeaturePage;
  
  test.beforeEach(async ({ page }) => {
    // ARRANGE: Authentication
    const loginPage = new LoginPage(page);
    const testUser = await getTestUser();
    
    featurePage = new FeaturePage(page);
    
    await page.goto("/login");
    await loginPage.login(testUser.email, testUser.password);
    await hasUrl(page, "/marketplace");
    
    // ARRANGE: Navigate to feature
    await page.goto("/feature-url");
    await featurePage.isLoaded();
  });
  
  test("test name", async ({ page }) => {
    // ARRANGE: Setup test state
    
    // ACT: Perform action
    
    // ASSERT: Verify outcome
  });
});
```

### 6.2 Test Metadata (REQUIRED)
Every test MUST include metadata comment:
```typescript
/**
 * Test Case ID: TC-###
 * Covered Requirements: FR-1, FR-2, NFR-1
 * Test Type: Happy Path | Negative | Edge Case
 * Source Artifacts: Gherkin Scenario S#
 * Assumptions: User exists, authenticated
 * Preconditions Established: Agent created via API/UI
 */
test("test description", async ({ page }) => {
  // test body
});
```

---

## 7. Assertion Patterns

### 7.1 Playwright Assertions
```typescript
import { expect } from "@playwright/test";

await expect(element).toBeVisible();
await expect(element).toHaveText("Expected text");
await expect(element).toBeAttached();
await expect(page).toHaveURL(/pattern/);
```

### 7.2 Custom Assertions
```typescript
import { hasUrl } from "./utils/assertion";

await hasUrl(page, "/expected-path");
```

---

## 8. State Management Patterns

### 8.1 Observed State Creation Strategies

#### Via API (Preferred)
```typescript
// Example from monitor.spec.ts - using API indirectly
const response = await page.request.get("http://localhost:3000/api/proxy/api/blocks");
const data = await response.json();
```

#### Via UI Navigation
```typescript
// Example from library.spec.ts
await page.goto("/library");
await libraryPage.isLoaded();
const agents = await libraryPage.getAgents();
```

#### Via Page Object Methods
```typescript
// Example from monitor.spec.ts
await navigateToLibrary(page);
await clickFirstAgent(page);
await runAgent(page);
```

### 8.2 State Helper Functions
Located in page objects or utils:
- `navigateToLibrary(page)` - Navigate to library
- `clickFirstAgent(page)` - Select first agent
- `runAgent(page)` - Run selected agent
- `waitForAgentPageLoad(page)` - Wait for agent page

---

## 9. Wait Strategies (CRITICAL)

### 9.1 Deterministic Waits (PREFERRED)
```typescript
// Wait for element
await element.waitFor({ state: "visible", timeout: 10_000 });

// Wait for URL
await page.waitForURL(/pattern/);

// Wait for load state
await page.waitForLoadState("domcontentloaded");

// Wait for network idle
await page.waitForLoadState("networkidle");
```

### 9.2 Forbidden Waits
❌ `await page.waitForTimeout(1000)` - Arbitrary waits  
✅ Use `.waitFor()` with specific conditions

### 9.3 Exception: Short Debounce
`await page.waitForTimeout(500)` - Only for debouncing search/filter inputs (observed in existing tests)

---

## 10. Configuration & Setup

### 10.1 Playwright Config Key Settings
- Test directory: `./AutoGPT/tests`
- Base URL: `http://localhost:3000/`
- Timeout: 25000ms (default)
- Global setup: `./AutoGPT/tests/global-setup.ts`
- Parallel execution: `fullyParallel: true`
- Browser: Chromium only

### 10.2 Auto-Accept Cookies
All tests auto-accept cookies via `storageState`:
```typescript
localStorage: [{
  name: "autogpt_cookie_consent",
  value: JSON.stringify({
    hasConsented: true,
    timestamp: Date.now(),
    analytics: true,
    monitoring: true,
  })
}]
```

---

## 11. Delete Agent Specific Findings

### 11.1 Current Monitor Page State
- `MonitorPage.deleteAgent(agent)` method exists but is **EMPTY**
- Only contains: `console.log(\`deleting agent ${agent.id} ${agent.name}\`)`
- **MUST BE IMPLEMENTED** for tests to work

### 11.2 Required Implementation
The `deleteAgent()` method needs to:
1. Click the agent row (select agent)
2. Locate trash icon
3. Click trash icon
4. Handle confirmation dialog
5. Confirm deletion

### 11.3 Agent Interface
```typescript
interface Agent {
  id: string;
  name: string;
  runCount: number;
  lastRun: string;
}
```

### 11.4 Existing Monitor Tab Selectors
From code analysis:
- `data-testid="monitor-page"` - Monitor page container
- `data-testid="{agent.id}"` - Agent row (e.g., "flow-run-123")
- Table structure: `<thead>`, `<tbody>`, `<tr data-testid="...">`, `<td>`
- `data-name` attribute on rows contains agent name

### 11.5 Missing Information (REQUIRES DISCOVERY)
❓ Trash icon selector (test-id or role?)  
❓ Confirmation dialog selectors  
❓ "Yes, delete" button selector  
❓ Cancel button selector  

**ACTION REQUIRED**: Inspect UI or source code to find these selectors before implementing tests.

---

## 12. Test Execution & Validation

### 12.1 List Tests Command
```bash
npx playwright test --list
```
Must pass without errors after test creation.

### 12.2 Run Specific Test File
```bash
npx playwright test delete-agent.spec.ts
```

### 12.3 Run Single Test
```bash
npx playwright test -g "test name pattern"
```

---

## 13. Infrastructure Alignment Checklist

For generated tests to be valid, they MUST:

- ✅ Use TypeScript (.spec.ts)
- ✅ Import from @playwright/test
- ✅ Use getSelectors() - NEVER page.locator()
- ✅ Use Page Object Methods
- ✅ Extend or create Page Objects as needed
- ✅ Use getTestUser() for auth
- ✅ Follow ARRANGE → ACT → ASSERT
- ✅ Include test metadata comments
- ✅ Use deterministic waits
- ✅ Navigate via page.goto() or Page Object methods
- ✅ Place in correct directory structure
- ✅ Verify imports resolve (npx playwright test --list)

---

## 14. Recommendations for Delete Agent Tests

### 14.1 File Location
Create: `AutoGPT/tests/delete-agent.spec.ts`

### 14.2 Required Page Object Updates
Extend `MonitorPage` to implement:
```typescript
async deleteAgent(agent: Agent, confirm: boolean = true): Promise<void>
async ensureAgentExists(agentName: string): Promise<Agent>
async clickTrashIcon(agent: Agent): Promise<void>
async confirmDeletion(): Promise<void>
async cancelDeletion(): Promise<void>
async hasDeleteConfirmationDialog(): Promise<boolean>
```

### 14.3 State Creation Strategy
**Preferred**: Create test agent via API or existing helper  
**Fallback**: Import agent from file using `MonitorPage.importFromFile()`  
**Last Resort**: Navigate to build and create simple agent  

### 14.4 Selector Discovery Required
Before implementing tests, discover:
1. Trash icon selector (inspect element)
2. Confirmation dialog selectors
3. Button selectors within dialog

---

## 15. Gaps & Risks

### 15.1 Implementation Gaps
- ❌ `MonitorPage.deleteAgent()` not implemented
- ❌ No trash icon selector documented
- ❌ No confirmation dialog selectors documented
- ❌ No agent creation helper in MonitorPage

### 15.2 Risks
- **HIGH**: Tests cannot run until `deleteAgent()` implemented
- **MEDIUM**: Unknown selectors may require UI inspection
- **LOW**: Agent creation strategy needs definition

### 15.3 Assumptions to Validate
- Trash icon has data-testid or accessible role
- Confirmation dialog has accessible role
- Buttons have accessible names or test-ids
- Agent deletion is instant (no loading states)

---

## 16. Next Steps

1. ✅ Infrastructure analysis complete
2. ⏭️ Proceed to Phase 1: Scenario Extraction
3. ⏭️ Phase 2: State Dependency Analysis
4. ⏭️ Phase 3: Precondition Strategy
5. ⏭️ Phase 4: Feasibility Gate
6. ⏭️ Phase 5: Implement tests + extend MonitorPage

**BLOCKER**: Before Phase 5, must discover missing selectors via UI inspection or source code review.

---

**End of Infrastructure Analysis**
