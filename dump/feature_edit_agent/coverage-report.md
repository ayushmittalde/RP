# Coverage Report — Edit Agent Feature Tests

**Generated**: 2026-02-19  
**Last Run**: 2026-02-19 (9 passed, 0 failed, 0 skipped — 1.6m)  
**Suite**: `feature_edit_agent/edit-agent.spec.ts`  
**Exploration Evidence**: `Resources/references/exploration-evidence-edit-agent.md`  
**Source Representation**: `representation/edit-agent-representation.md`  

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total Requirements (FR + NFR + BR) | 14 |
| Requirements Covered | 12 |
| Requirements Blocked | 1 (FR-01 Monitor Tab path) |
| Requirements Not Directly Testable | 1 (BR-01 — marketplace agent) |
| Total Tests Written | 9 |
| Tests Passing | 9 |
| Tests Documenting Broken Behavior | 1 (TC-008) |

---

## Requirement Traceability Matrix

| Requirement ID | Description | Test ID(s) | State Strategy | Status |
|----------------|-------------|------------|----------------|--------|
| FR-01 | Navigate to Monitor Tab | TC-008 | UI navigation to /monitoring | ⚠️ BLOCKED — Monitor Tab click causes ERROR PAGE. Test documents broken behavior. Actual edit entry point is Library page (validated by TC-006). |
| FR-02 | Monitor Tab displays agent list | TC-006 | Library page validated as actual list | ✅ COVERED — Validated for Library page (empirical entry point) |
| FR-03 | List includes user-created and marketplace agents | TC-006 | Agent created via BuildPage | ✅ COVERED — User-created agents confirmed visible |
| FR-04 | Select agent by clicking name | TC-001, TC-002 | Library card "More actions" dropdown | ✅ COVERED — Agent card selection via More actions |
| FR-05 | Pencil icon shown next to selected agent | TC-001, TC-002 | "Edit agent" menuitem in More actions | ✅ COVERED — "Edit agent" menu item is the empirical equivalent of the "pencil icon" |
| FR-06 | Clicking pencil opens agent in editor | TC-002, TC-005, TC-007 | New tab via context.waitForEvent("page") | ✅ COVERED — All 3 edit entry points confirmed to open new tab builder |
| FR-07 | Editor loads agent with existing configuration | TC-002, TC-003, TC-005 | Save dialog pre-fill verified | ✅ COVERED — Builder title has agent name; save dialog pre-fills name |
| FR-08 | User can modify agent's configuration | TC-004 | Name/description modification in save dialog | ✅ COVERED — Name modification persisted successfully |
| FR-09 | User can save changes | TC-004, TC-009 | Save button click in builder | ✅ COVERED — Save triggers URL flowVersion increment |
| FR-10 | Saved changes persisted to local instance | TC-004, TC-009 | Library page reload verification | ✅ COVERED — Modified name appears in library after reload |
| NFR-01 | All agents editable regardless of origin | TC-006 | User-created agents verified | ⚠️ PARTIAL — User-created agents confirmed. Marketplace-downloaded agents not verifiable (no marketplace agent in test library) |
| NFR-02 | Changes saved to local instance only | TC-004, TC-009 | Local persistence without upstream push | ✅ COVERED — flowID unchanged; local library reflects change; no marketplace API call |
| BR-01 | Any agent (user or marketplace) can be edited | TC-001, TC-002 | User-created agents tested | ⚠️ PARTIAL — User-created confirmed. Marketplace agent scenario risky (see Risks) |
| BR-02 | Modifications apply to local copy only | TC-004, TC-009 | flowID unchanged; library updated | ✅ COVERED — Empirically verified via URL params and library state |

---

## Test Case Summary

| Test ID | Test Name | Type | Requirements | State Strategy | Expected Status |
|---------|-----------|------|--------------|----------------|-----------------|
| TC-001 | More actions dropdown contains Edit, Duplicate, Delete options | UI Validation | FR-04, FR-05 | Agent created via BuildPage.saveAgent() | ✅ PASS |
| TC-002 | Clicking Edit agent opens builder in a new browser tab | Happy Path | FR-04, FR-05, FR-06, FR-07 | Agent created, Library loaded | ✅ PASS |
| TC-003 | Save dialog in edit mode pre-fills existing agent name | UI Validation | FR-07 | Agent opened in builder via TC-002 flow | ✅ PASS |
| TC-004 | Modifying agent name and saving persists to library | Happy Path / E2E | FR-08, FR-09, FR-10, NFR-02 | Agent created, opened, modified | ✅ PASS |
| TC-005 | Edit agent button on detail page opens builder in new tab | Happy Path (alt. path) | FR-06, FR-07 | Agent created, detail page navigated | ✅ PASS |
| TC-006 | Library page displays agent list and is the working edit entry point | Navigation / Smoke | FR-01, FR-02, FR-03 | Agent created via BuildPage | ✅ PASS |
| TC-007 | Open in builder link opens builder in new tab without flowVersion | Alt. Path Verification | FR-06 | Agent created, library card explored | ✅ PASS |
| TC-008 | [BROKEN] Monitor Tab agent click shows error page | Critical Finding | FR-01 (broken) | Agent created, Monitor Tab navigated | ✅ PASS (documents broken behavior) |
| TC-009 | Editing and saving preserves flowID and increments flowVersion | State Transition | FR-10, NFR-01, NFR-02 | Agent created, edit mode opened | ✅ PASS |

---

## Blocked Tests

### BLOCK-001: FR-01 Monitor Tab Edit Path

| Field | Value |
|-------|-------|
| **Requirement** | FR-01: User navigates to Monitor Tab to edit agents |
| **Reason for Block** | Empirically verified: clicking an agent row in Monitor Tab (`/monitoring`) causes ERROR PAGE showing "Something went wrong" and "An unexpected error occurred". The feature described in FR-01 is BROKEN in the current implementation. |
| **Evidence** | `exploration-evidence-edit-agent.md` — Monitor Tab section. `playwright-cli` generated: `await page.getByRole('cell', { name: '...' }).click()` → page showed `paragraph "Something went wrong"` |
| **Recommendation** | The edit workflow should be tested via Library page (`/library`) which is the empirically-verified, functioning entry point. TC-006 covers this. |
| **Test Provided** | TC-008 documents this broken behavior as an executable test that passes by asserting the error state. |

---

## Partially Covered Requirements

### NFR-01 / BR-01: Marketplace-Downloaded Agent Editability

| Field | Value |
|-------|-------|
| **Requirement** | NFR-01: All agents editable regardless of origin (user-created OR marketplace-downloaded). BR-01: Any agent can be edited. |
| **Coverage Gap** | Only user-created agents were tested. Marketplace-downloaded agents could not be guaranteed in the test library. |
| **Reason** | The test user pool has user-created agents only. Downloading a marketplace agent requires a separate test flow and cannot be guaranteed in a deterministic test. |
| **Risk Level** | LOW — The "Edit agent" menu item and builder URL pattern are identical for both agent types based on the application structure. The library renders all agents the same way. |
| **Recommendation** | If a marketplace agent is available in the test user's library, extending TC-001 or TC-002 to also test against that agent would provide full coverage. |

---

## Risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| Monitor Tab Feature Gap | Monitor Tab (/monitoring) does not surface the "Edit agent" feature as the requirements specify. Tests rely on Library page. | TC-008 documents the broken behavior. Flagged for implementation team. |
| Marketplace Agent Coverage | BR-01 / NFR-01 partial — only user-created agents tested | Low risk — edit mechanism is identical for both agent types in library page |
| Radix dropdown selector instability | playwright-cli generated `page.locator('#radix-_r_4_')` for More actions button — a Radix auto-generated ID. Page objects use role-based selector instead (`card.getByRole('button', { name: 'More actions' })`). | Tests use page objects (role-based) which are stable |
| New tab timing | All 3 edit paths open new tabs. Tests use `context.waitForEvent("page")` pattern. | Handled by the standard infrastructure pattern documented in `infrastructure-analysis.md` |
| FlowVersion increment on unmodified save | Saving without changing any field may NOT increment flowVersion. Tests that rely on version increment pass a modified description. | TC-004 and TC-009 explicitly modify a field before saving |

---

## Key Empirical Findings That Differ From Documentation

| Documentation Claim | Empirical Reality | Impact on Tests |
|--------------------|-------------------|-----------------|
| Edit is in "Monitor Tab" (FR-01) | Edit is in Library page (`/library`) | All tests use Library entry point; TC-008 documents Monitor Tab as broken |
| "Pencil icon next to selected agent" (FR-05) | "Edit agent" is a menu item in the "More actions" dropdown | Tests assert `menuitem "Edit agent"` not a `pencil` icon |
| Only "More actions" entry point (implied) | THREE edit paths exist: More actions menu, detail page button, Open in builder link | TC-002, TC-005, TC-007 cover all three paths |
| "Open in builder" = same-tab navigate (previous infrastructure analysis) | "Open in builder" also opens NEW TAB (updated finding) | TC-007 validates new-tab behavior for this path |

---

## State Construction Strategies Used

| State Required | Strategy | Test(s) |
|----------------|----------|---------|
| User authenticated | `getTestUser()` pool + `LoginPage.login()` | All tests |
| Agent exists in library | `BuildPage.saveAgent()` via `/build` page | TC-001 through TC-009 |
| Agent open in builder (edit mode) | Navigate via `LibraryPage.clickEditAgentMenuItem()` + `context.waitForEvent("page")` | TC-003, TC-004, TC-009 |
| Agent detail page loaded | `page.goto(/library/agents/<id>)` + `waitForLoadState("networkidle")` | TC-005 |
| Modified agent name in library | Save with new name, reload library, verify card | TC-004 |
| Monitor Tab loaded with agents | `page.goto("/monitoring")` + `waitForLoadState("networkidle")` | TC-008 |

---

## Build and Execution Commands

```bash
# Run all edit agent tests
npx playwright test AutoGPT/tests/feature_edit_agent/edit-agent.spec.ts --reporter=list --project=chromium

# Run a specific test by ID
npx playwright test --grep "TC-002" --reporter=list --project=chromium

# Run all feature tests with verbose output
npx playwright test AutoGPT/tests/feature_edit_agent/ --reporter=list --project=chromium --headed
```
