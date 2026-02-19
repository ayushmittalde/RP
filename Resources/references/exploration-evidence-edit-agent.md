# Exploration Evidence — Edit Agent Feature

**Exploration Date**: 2026-02-19  
**Explorer**: GitHub Copilot (Phase 5a Live System Exploration)  
**Test User**: Sherri97@yahoo.com (from user-pool.json)  
**Application**: AutoGPT Platform at http://localhost:3000  

---

## Summary of Empirical Findings

### CRITICAL DIVERGENCE FROM REQUIREMENTS DOCUMENTATION

| Requirement | Documentation States | Empirical Reality |
|-------------|---------------------|-------------------|
| FR-01 | Navigate to Monitor Tab to edit | Edit feature lives in LIBRARY PAGE, not Monitor Tab |
| FR-04 | Select agent by clicking name in agent list | Monitor Tab agent click causes ERROR PAGE |
| FR-05 | Pencil icon displayed next to selected agent | "Edit agent" is inside a dropdown menu accessed via "More actions" button |
| FR-06 | Clicking pencil opens agent in editor | "Edit agent" menu item click opens NEW TAB |
| "Open in builder" navigation | Infrastructure analysis said same-tab navigation | ALSO opens NEW TAB (no flowVersion param) |

---

## Code Bank (Verbatim playwright-cli Generated Code)

### Login Flow
```typescript
// Cookie acceptance
await page.getByRole('button', { name: 'Accept All' }).click();

// Email fill
await page.getByRole('textbox', { name: 'Email' }).fill('Sherri97@yahoo.com');

// Password fill
await page.getByRole('textbox', { name: 'Password Forgot password?' }).fill('vSQ8Oc6G5nI0');

// Login submit
await page.getByRole('button', { name: 'Login' }).click();
// → POST-LOGIN URL: http://localhost:3000/marketplace
```

### Builder — Save New Agent
```typescript
// Save button click (data-testid="blocks-control-save-button")
await page.getByTestId('blocks-control-save-button').click();

// Name field fill (data-testid="save-control-name-input")
await page.getByTestId('save-control-name-input').fill('EditAgentExploration-Test');

// Save dialog save button (data-testid="save-control-save-agent-button")
await page.getByTestId('save-control-save-agent-button').click();
// → POST-SAVE URL: http://localhost:3000/build?flowID=d05c7ed7-66a7-4849-b2b8-bb02d9c8c09d&flowVersion=1
```

### Library Page — More Actions Dropdown Open
```typescript
// More actions button click (NOTE: playwright-cli generated Radix ID)
await page.locator('#radix-_r_4_').click();
// PREFERRED EQUIVALENT (tested to work via page objects):
// card.first().getByRole('button', { name: 'More actions' }).click();
```

### Library Page — Edit Agent Menu Item Click
```typescript
await page.getByRole('menuitem', { name: 'Edit agent' }).click();
// → RESULT: NEW TAB OPENED
// → Tab URL: http://localhost:3000/build?flowID=d05c7ed7-66a7-4849-b2b8-bb02d9c8c09d&flowVersion=1
```

### Library Page — Open in Builder Link Click
```typescript
await page.getByTestId('library-agent-card-open-in-builder-link').first().click();
// → RESULT: NEW TAB OPENED (contrary to infrastructure analysis)
// → Tab URL: http://localhost:3000/build?flowID=d05c7ed7-66a7-4849-b2b8-bb02d9c8c09d
// Note: NO flowVersion param in URL (unlike Edit agent action)
```

### Agent Detail Page — Edit Agent Button Click
```typescript
await page.getByRole('button', { name: 'Edit agent' }).click();
// → RESULT: NEW TAB OPENED  
// → Tab URL: http://localhost:3000/build?flowID=d05c7ed7-66a7-4849-b2b8-bb02d9c8c09d&flowVersion=2
```

### Monitor Tab — Agent Row Click (BROKEN)
```typescript
await page.getByRole('cell', { name: 'EditAgentExploration-Modified' }).click();
// → RESULT: ERROR PAGE shown
// → Text: "Something went wrong"
// → Text: "We had the following error when retrieving application:"
// → Text: "An unexpected error occurred. Please try again or contact support if the problem persists."
```

### Builder in Edit Mode — Save Dialog Pre-fill Verification
```typescript
// Save button opens dialog
await page.getByTestId('blocks-control-save-button').click();
// Name field value is PRE-FILLED with existing agent name
const nameVal = await page.getByTestId('save-control-name-input').inputValue();
// nameVal === "EditAgentExploration-Test" ← CONFIRMED PRE-FILL
```

### Builder in Edit Mode — Modify Name and Save
```typescript
await page.getByTestId('blocks-control-save-button').click();
await page.getByTestId('save-control-name-input').waitFor({ state: 'visible', timeout: 5000 });
await page.getByTestId('save-control-name-input').fill('EditAgentExploration-Modified');
await page.getByTestId('save-control-description-input').fill('Modified for testing');
await page.getByTestId('save-control-save-agent-button').click();
// → POST-SAVE URL: flowVersion INCREMENTED: flowVersion=1 → flowVersion=2
// → CONFIRMED: http://localhost:3000/build?flowID=d05c7ed7-66a7-4849-b2b8-bb02d9c8c09d&flowVersion=2
```

### Library — Agent Name Update Verification After Save
```typescript
// After page reload, modified name appears in library
// CONFIRMED: First card name was "EditAgentExploration-Modified" (was "EditAgentExploration-Test")
await page.reload();
await page.waitForLoadState('networkidle');
// Agent list: ["EditAgentExploration-Modified", ...]  ← CONFIRMED PERSISTENCE
```

---

## Snapshot Protocol

### Snapshot: Library page with agents loaded
- **URL**: `http://localhost:3000/library?sort=updatedAt`
- **Key elements observed**:
  - `data-testid="agents-count"` → "10" (number of agents)
  - 10x `data-testid="library-agent-card"` cards
  - Each card has `button "More actions"` 
  - Each card has `link "<AgentName>"` wrapping `heading "<AgentName>" [level=5]`
  - Each card has `data-testid="library-agent-card-open-in-builder-link"` (href = `/build?flowID=<uuid>`)
  - Each card has `data-testid="library-agent-card-see-runs-link"` (href = `/library/agents/<uuid>`)

### Snapshot: More Actions Dropdown Opened
- **URL**: `http://localhost:3000/library?sort=updatedAt`
- **Elements appeared**:
  - `menuitem "Edit agent"` (ref=e381)
  - `menuitem "Duplicate agent"` (ref=e383)
  - `menuitem "Delete agent"` (ref=e385)

### Snapshot: After "Edit agent" Click from Library
- **Current tab (0)**: Stays on `http://localhost:3000/library?sort=updatedAt`
- **New tab (1) OPENED**: `http://localhost:3000/build?flowID=d05c7ed7-66a7-4849-b2b8-bb02d9c8c09d&flowVersion=1`
- **New tab title**: `EditAgentExploration-Test - Builder - AutoGPT Platform`
- **Key assertion**: Builder page title contains the agent name (`<AgentName> - Builder - AutoGPT Platform`)

### Snapshot: Builder in Edit Mode
- **URL**: `/build?flowID=<uuid>&flowVersion=<n>`
- **Title**: `<AgentName> - Builder - AutoGPT Platform`
- **Key elements**:
  - Save button: `data-testid="blocks-control-save-button"` — visible
  - Save dialog opens when save button clicked
  - Name input: `data-testid="save-control-name-input"` — pre-filled with existing agent name ✅
  - Description input: `data-testid="save-control-description-input"` — empty (not set during creation)
  - Save button: `data-testid="save-control-save-agent-button"`

### Snapshot: After Name Modification and Save
- **URL before**: `flowVersion=1`
- **URL after**: `flowVersion=2` ← flowVersion INCREMENTS on save ✅
- **flowID unchanged**: same UUID

### Snapshot: Monitor Tab (`/monitoring`)
- **URL**: `http://localhost:3000/monitoring`
- **Elements present**:
  - Table with columns: "Name", "# of runs", "Last run"
  - 10 agent rows (same agents as library), all `[cursor=pointer]`
  - **NO** pencil icon, NO edit button anywhere
  - NO "Edit agent" element
- **After clicking agent row**:
  - `paragraph "Something went wrong"` appeared
  - `paragraph "An unexpected error occurred. Please try again or contact support if the problem persists."` appeared
  - `button "Report Error"` appeared
  - URL stayed at `/monitoring`

### Snapshot: Agent Detail Page (`/library/agents/<id>?activeTab=runs`)
- **Key elements**:
  - `button "Edit agent"` — visible (after waitForLoadState networkidle)
  - `button "Export agent to file"` — visible
  - `button "Delete agent"` — visible
  - Breadcrumb: `link "My Library"` / `link "<AgentName>"`
- **After clicking "Edit agent"**:
  - NEW TAB opened at `/build?flowID=<uuid>&flowVersion=<currentVersion>`

---

## Timing Observations (MANDATORY for waitFor decisions)

| Action | Observation | Required waitFor |
|--------|-------------|-----------------|
| Navigate to `/library` | Sort param appended immediately | None for URL |
| Library agent cards | Cards NOT visible immediately on first snapshot (showed "0" count) | `waitForLoadState('networkidle')` |
| Builder page after "Edit agent" click | Title and URL available immediately in new tab | `waitForLoadState('domcontentloaded')` |
| Save dialog after clicking save button | Appears within ~800ms | `waitFor({ state: 'visible', timeout: 5000 })` on name-input |
| URL after save | Changes within ~2 seconds | `waitForURL(/flowVersion=/, { timeout: 10000 })` |
| Agent detail page | Buttons (Edit agent etc.) NOT immediately visible | `waitForLoadState('networkidle')` |
| Library reload after edit | Agent name updated | `waitForLoadState('networkidle')` after `reload()` |

---

## Console Errors During Exploration
Two repeated non-blocking errors (infrastructure-level, not feature-related):
- `/_vercel/insights/script.js` — 404 Not Found (Vercel analytics not available locally)
- `/_vercel/speed-insights/script.js` — 404 Not Found (same)

These errors can be ignored in test assertions.

---

## Verified Element Selectors (Empirically Confirmed)

| Element | Selector | Method |
|---------|----------|--------|
| Library agent card | `data-testid="library-agent-card"` | `getId("library-agent-card")` |
| Agent card name | `data-testid="library-agent-card-name"` | `getId("library-agent-card-name")` |
| Agent count badge | `data-testid="agents-count"` | `getId("agents-count")` |
| More actions button | `role="button" name="More actions"` within card | use `card.getByRole('button', { name: 'More actions' })` |
| Edit agent menuitem | `role="menuitem" name="Edit agent"` | `getRole("menuitem", "Edit agent")` |
| Duplicate agent menuitem | `role="menuitem" name="Duplicate agent"` | `getRole("menuitem", "Duplicate agent")` |
| Delete agent menuitem | `role="menuitem" name="Delete agent"` | `getRole("menuitem", "Delete agent")` |
| Open in builder link | `data-testid="library-agent-card-open-in-builder-link"` | `getId("library-agent-card-open-in-builder-link")` |
| See runs link | `data-testid="library-agent-card-see-runs-link"` | `getId("library-agent-card-see-runs-link")` |
| Builder save button | `data-testid="blocks-control-save-button"` | `getId("blocks-control-save-button")` |
| Save dialog name input | `data-testid="save-control-name-input"` | `getId("save-control-name-input")` |
| Save dialog desc input | `data-testid="save-control-description-input"` | `getId("save-control-description-input")` |
| Save dialog save button | `data-testid="save-control-save-agent-button"` | `getId("save-control-save-agent-button")` |
| Tutorial skip button | `role="button" name="Skip Tutorial"` | `getButton("Skip Tutorial")` |
| Detail page edit button | `role="button" name="Edit agent"` | `getButton("Edit agent")` |
| Monitor error text | `paragraph "Something went wrong"` | `getText("Something went wrong")` |

---

## New Tab Handling Pattern (CRITICAL — All Edit Paths)

**CONFIRMED**: ALL three edit paths open NEW TABS:

| Entry Point | URL Pattern | New Tab? |
|-------------|-------------|---------|
| Library "More actions" → "Edit agent" | `/build?flowID=<uuid>&flowVersion=<n>` | ✅ YES |
| Agent detail page "Edit agent" button | `/build?flowID=<uuid>&flowVersion=<n>` | ✅ YES |
| Library card "Open in builder" link | `/build?flowID=<uuid>` (no flowVersion) | ✅ YES |

**Required code pattern for new-tab-opening actions**:
```typescript
const newPagePromise = context.waitForEvent("page");
await libraryPage.clickEditAgentMenuItem(); // or clickOpenInBuilderLink()
const builderPage = await newPagePromise;
await builderPage.waitForLoadState("domcontentloaded");
```

---

## Feasibility Analysis Update (Post-Exploration)

| Scenario | Pre-Exploration | Post-Exploration | Reason |
|----------|----------------|-----------------|--------|
| TC-001: Edit via More actions → new tab | Executable | ✅ EXECUTABLE | Fully verified |
| TC-002: Builder pre-fills agent name | Executable | ✅ EXECUTABLE | Confirmed pre-fill |
| TC-003: Modify name, save, verify persistence | Risky | ✅ EXECUTABLE | Confirmed flowVersion increment + library update |
| TC-004: More actions dropdown has Edit/Duplicate/Delete | Executable | ✅ EXECUTABLE | Confirmed all 3 items |
| TC-005: Edit from detail page → new tab | Executable | ✅ EXECUTABLE | Confirmed new tab behavior |
| TC-006: Monitor Tab agent click → error | N/A previously | ✅ EXECUTABLE (documents broken behavior) | Confirmed error page |
| TC-007 (FR-01): Edit via Monitor Tab | Risky | ❌ BLOCKED | Monitor Tab click = error page |
| TC-008: Marketplace agent edit | Risky | ⚠️ RISKY | Requires marketplace agent in library — cannot guarantee |
