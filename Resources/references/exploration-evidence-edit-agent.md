# Exploration Evidence – Edit Agent Feature

**Date**: 2026-02-23  
**Explorer**: GitHub Copilot – Principal QA Automation Architect  
**App Under Test**: AutoGPT Builder at `http://localhost:3000`  
**Phase**: 4a – Live System Exploration  
**Test User**: Sherri97@yahoo.com (from `.auth/user-pool.json`)

---

## 1. Code Bank (Verbatim playwright-cli Generated Code)

All lines below were directly emitted by `playwright-cli` during this session.

| # | Action | Generated Code | getSelectors() Equivalent |
|---|--------|----------------|--------------------------|
| CB-01 | Fill email field | `await page.getByRole('textbox', { name: 'Email' }).fill('Sherri97@yahoo.com');` | `getField('Email')` |
| CB-02 | Fill password field | `await page.getByRole('textbox', { name: 'Password Forgot password?' }).fill('...');` | Uses LoginPage.login() |
| CB-03 | Click Login | `await page.getByRole('button', { name: 'Login' }).click();` | `getButton('Login')` |
| CB-04 | Accept cookies | `await page.getByRole('button', { name: 'Accept All' }).click();` | `getButton('Accept All')` |
| CB-05 | Skip Tutorial | `await page.getByRole('button', { name: 'Skip Tutorial' }).click();` | `getButton('Skip Tutorial')` |
| CB-06 | Click Save button | `await page.getByTestId('blocks-control-save-button').click();` | `getId('blocks-control-save-button')` |
| CB-07 | Fill Name in save dialog | `await page.getByTestId('save-control-name-input').fill('EA-Explore-Agent-001');` | `getId('save-control-name-input')` |
| CB-08 | Fill Description in save dialog | `await page.getByTestId('save-control-description-input').fill('...');` | `getId('save-control-description-input')` |
| CB-09 | Click Save Agent button | `await page.getByTestId('save-control-save-agent-button').click();` | `getId('save-control-save-agent-button')` |
| CB-10 | Click More actions | `await page.locator('#radix-_r_8_').click();` | **UNSTABLE** – Use LibraryPage.openAgentActions() |
| CB-11 | Click Edit agent menuitem | `await page.getByRole('menuitem', { name: 'Edit agent' }).click();` | `getRole('menuitem', 'Edit agent')` |
| CB-12 | Click Open in builder link | `await page.getByTestId('library-agent-card-open-in-builder-link').first().click();` | `getId('library-agent-card-open-in-builder-link')` |
| CB-13 | Click Edit agent button (detail page) | `await page.getByRole('button', { name: 'Edit agent' }).click();` | `getButton('Edit agent')` |
| CB-14 | Get name input value | `await page.getByTestId('save-control-name-input').evaluate('el => el.value');` | `await getId('save-control-name-input').evaluate(...)` |
| CB-15 | Get description input value | `await page.getByTestId('save-control-description-input').evaluate('el => el.value');` | same pattern |
| CB-16 | Click row in Monitor Tab | `await page.getByTestId('9ad39dbb-2dc3-4aa7-8e97-96d3bffbb5ee').click();` | `getId('<agent-uuid>')` |

---

## 2. Snapshot Protocol

### SP-01: Login Page (Pre-Login)
- **URL**: `http://localhost:3000/login`
- **Title**: `"AutoGPT Platform"`
- **Elements present**: email textbox, password textbox, Login button, Sign up link, cookie consent dialog

### SP-02: Post-Login Redirect
- **URL**: `http://localhost:3000/marketplace`
- **Title**: `"Marketplace - AutoGPT Platform"`
- **Confirms**: Post-login redirect goes to `/marketplace` (**FR-02 discrepancy: Library, not Monitor Tab**)

### SP-03: Build Page (Pre-Save)
- **URL**: `http://localhost:3000/build`
- **Title**: `"Builder - AutoGPT Platform"`
- **Elements present**:
  - Tutorial dialog: `dialog "Welcome to the Tutorial"` [active]
  - Skip Tutorial button: `button "Skip Tutorial"`
  - Save button: `button "Icon" [ref=e60]` → **maps to `data-testid="blocks-control-save-button"`** (confirmed by click emit)

### SP-04: Save Dialog (Open)
- **URL**: Unchanged (`/build`)
- **Dialog**: `dialog [ref=e132]` (unnamed)
- **Fields**:
  - `textbox "Name" [active]` → `data-testid="save-control-name-input"` — **placeholder**: "Enter your agent name"
  - `textbox "Description"` → `data-testid="save-control-description-input"` — **placeholder**: "Your agent description"
  - `textbox "Version" [disabled]: "1"` — shows current version number (new field, disabled)
  - `button "Save Agent"` → `data-testid="save-control-save-agent-button"`
  - `button "Set schedule"` — schedule the agent (separate feature)

### SP-05: Post-Save URL
- **URL**: `http://localhost:3000/build?flowID=51708b90-8065-46b4-a42d-60e10c7b2fec&flowVersion=1`
- **Confirms**: Agent saved with `flowID` and `flowVersion=1`

### SP-06: Library Page (After Agent Load)
- **URL**: `http://localhost:3000/library?sort=updatedAt`
- **Title**: `"AutoGPT Platform"` (temporarily during load), then `"Library – AutoGPT Platform"`
- **Count badge**: Shows "0" initially, loads to "16" asynchronously (**TIMING NOTE**)
- **Agent card structure**:
  ```
  generic [data-testid="library-agent-card"]:
    link "Built by you" (or "marketplace")  
    button "Add to favorites"
    button "More actions"  ← UNSTABLE ID (Radix); use role-based selector
    generic:
      link "<agent-name>" → heading [level=5]
      link "See runs" [data-testid="library-agent-card-see-runs-link"]
      link "Open in builder" [data-testid="library-agent-card-open-in-builder-link"]
  ```

### SP-07: More Actions Dropdown
- **URL**: Unchanged
- **Menu**: `menu "More actions" [active]`
- **Items**:
  - `menuitem "Edit agent"` ← maps to `getRole("menuitem", "Edit agent")`
  - `menuitem "Duplicate agent"` ← maps to `getRole("menuitem", "Duplicate agent")`
  - `menuitem "Delete agent"` ← maps to `getRole("menuitem", "Delete agent")`
- **No other items present** — exactly 3

### SP-08: Edit Agent New Tab (from Library More Actions)
- **Library tab (0)**: URL stays at `/library?sort=updatedAt`
- **Builder tab (1)**: URL = `/build?flowID=51708b90-8065-46b4-a42d-60e10c7b2fec&flowVersion=1`
- **Builder tab title** (immediately after tab-select): `"EA-Explore-Agent-001 - Builder - AutoGPT Platform"`
- **Title format**: `"<agent-name> - Builder - AutoGPT Platform"`

### SP-09: Open In Builder New Tab (**BEHAVIORAL CHANGE**)
- **Expected (from infra analysis)**: Same-tab navigation
- **Actual (empirical)**: Opens a **NEW TAB** at `/build?flowID=<uuid>` (no flowVersion)
- **Generated code**: `await page.getByTestId('library-agent-card-open-in-builder-link').first().click();`
- **Tab list**: Tab 0 = library (current), Tab 1 = builder
- **⚠️ IMPACT**: Tests must use `context.waitForEvent('page')` for this action

### SP-10: Agent Detail Page
- **URL**: `http://localhost:3000/library/agents/9ad39dbb-2dc3-4aa7-8e97-96d3bffbb5ee?activeTab=runs`
- **Title**: `"EA-Explore-Agent-001 - Library - AutoGPT Platform"` — agent name IS in title
- **Elements**:
  - `heading "EA-Explore-Agent-001" [level=4]` — agent name heading
  - `paragraph "Exploration agent for edit feature testing"` — description shown
  - `button "Edit agent"` (contains inner `link "Edit agent"`) → opens NEW TAB
  - `button "Export agent to file"` — additional action
  - `button "Delete agent"` — additional action

### SP-11: Builder Pre-Fill Verification (Save Dialog)
- **Name input value** (via eval): `"EA-Explore-Agent-001"` ← **PRE-FILLED from persisted data** ✅
- **Description input value** (via eval): `"Exploration agent for edit feature testing"` ← **PRE-FILLED** ✅
- **Version field**: `"1"` (disabled, shows current version)

### SP-12: After Save with Modification
- **Before save URL**: `/build?flowID=51708b90...&flowVersion=1`
- **After save URL**: `/build?flowID=51708b90...&flowVersion=2`
- **flowVersion incremented**: 1 → 2 ✅

### SP-13: Library After Save (Persistence)
- Agent `"EA-Explore-Agent-001-Modified"` appears at top of library (sorted by updatedAt)
- Original name `"EA-Explore-Agent-001"` no longer in listing ✅

### SP-14: Monitor Tab Behavior
- **URL**: `http://localhost:3000/monitoring`
- **State**: Shows agents in a table (`heading "Agents" [level=3]`)
- **Row structure**: `row "<agent-name> <number>"` with `cell "<agent-name>"`
- **After click**: Row click generated `getByTestId('<agent-uuid>').click()` and caused ERROR PAGE:
  - `paragraph "Something went wrong"`
  - `paragraph "We had the following error when retrieving application:"`
  - `paragraph "An unexpected error occurred. Please try again or contact support..."`
  - Buttons: "Try Again", "Report Error", "Get Help"
- **Status**: Monitor Tab agent click = **STILL BROKEN** (FR-01 path is not feasible)

---

## 3. Timing Observations

| Observation | Required Wait |
|-------------|---------------|
| Post-login page may not immediately show marketplace | `hasUrl(page, /\/(marketplace|library|onboarding.*)?/)` |
| Library loads agents asynchronously (count "0" → "N") | `libraryPage.isLoaded()` — uses `waitForSelector` internally |
| Builder title shows "Builder - AutoGPT Platform" then updates to agent name | `expect(builderPage).toHaveTitle(new RegExp(agentName), { timeout: 15_000 })` |
| Save button may not be interactive immediately after navigation | `getId('blocks-control-save-button').waitFor({ state: 'visible', timeout: 15_000 })` |
| Save dialog inputs need to render before reading values | `getId('save-control-name-input').waitFor({ state: 'visible', timeout: 10_000 })` |
| flowVersion update in URL after save | `builderPage.waitForURL(/flowVersion=\d+/, { timeout: 15_000 })` |
| Second snapshot on library sometimes needed for agents to appear | Use `isLoaded()` which includes `waitForLoadState('networkidle')` |

---

## 4. Console Errors (Non-Blocking)
Present throughout: 
- `404 Not Found: /_vercel/speed-insights/script.js` — dev environment, non-blocking
- `404 Not Found: /_vercel/insights/script.js` — dev environment, non-blocking
- `[INFO] [BackendAPI] WebSocket connected to ws://localhost:8001/ws` — normal backend connection

---

## 5. Key Divergences from Requirements Documentation

| Documented Behavior | Actual Behavior | Impact on Tests |
|---------------------|-----------------|-----------------|
| FR-01: Monitor Tab is the entry point for editing agents | Library page (`/library`) is the actual edit entry point. Monitor Tab shows agents but clicking causes error page. | Tests use Library page, not Monitor Tab |
| FR-04: "Pencil icon" next to selected agent | "More actions" dropdown with "Edit agent" menuitem is the equivalent | Tests use More Actions → Edit agent |
| "Open in builder" navigates same tab | "Open in builder" NOW opens NEW TAB (behavioral change from Feb 22 infra analysis) | Tests must use `context.waitForEvent('page')` |
| Agent count immediately visible | Agent count loads asynchronously from "0" to actual count | `isLoaded()` must be called and waited for |
| Builder title = agent name | Builder title = `"<agent-name> - Builder - AutoGPT Platform"` | Use `toHaveTitle(new RegExp(agentName))` |

---

## 6. Test Scenarios Derived From Evidence (Phase 4b Input)

| TC | Scenario | Entry Point | Expected Behavior |
|----|----------|-------------|-------------------|
| TC-EA-001 | More Actions menu has exactly 3 items | Library card | Edit agent, Duplicate agent, Delete agent visible |
| TC-EA-002 | Edit agent from Library More Actions | Library More Actions → Edit agent | New tab at `/build?flowID=...&flowVersion=N`, title has agent name |
| TC-EA-003 | Save dialog pre-fills existing name+desc | Library More Actions → Edit agent → Save button | Name input = existing name, desc input = existing desc |
| TC-EA-004 | Save modification persists in library | Library More Actions → Edit agent → modify → save | flowVersion increments, new name visible in library |
| TC-EA-005 | Open in builder opens new tab (new behavior) | Library card Open in builder link | New tab at `/build?flowID=...` (no flowVersion) |
| TC-EA-006 | Edit from agent detail page | Detail page "Edit agent" button | New tab at `/build?flowID=...&flowVersion=N`, title has agent name |
| TC-EA-007 | Monitor Tab documents broken FR-01 path | `/monitoring` → click agent row | Error page: "Something went wrong" |
| TC-EA-008 | Empty library — no edit workflow | Library with 0 agents | No agent cards, no "More actions" buttons (skip if user has agents) |
