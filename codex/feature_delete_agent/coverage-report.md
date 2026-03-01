# Coverage Report — Feature: Delete Agent

- Feature folder: `AutoGPT/tests/feature_delete_agent/`
- Source representation: `representation/delete-agent-structured-representation.md`
- Exploration evidence: `Resources/references/exploration-evidence-delete-agent.md`
- Infrastructure baseline: `Resources/references/infrastructure-analysis.md`

## Requirement Traceability

| Requirement | Test ID | State Strategy | Status |
|---|---|---|---|
| FR-01 User can navigate to Monitor Tab/context | TC-DEL-001 | Login via `LoginPage` + `getTestUser()`, then navigate to `/monitoring` | BLOCKED (partial: context reachable, full flow blocked) |
| FR-02 User can find target agent in list | TC-DEL-001 | Use existing agents loaded in monitor table | BLOCKED (partial: rows visible, downstream blocked) |
| FR-03 User can select/click target agent | TC-DEL-001 | Click row by agent testid | BLOCKED (row click crashes page) |
| FR-04 User can initiate deletion via trash icon | TC-DEL-001 | Requires successful row selection first | BLOCKED (prerequisite transition fails) |
| FR-05 Confirmation dialog text is shown | TC-DEL-002 | Requires delete initiation | BLOCKED (delete control unreachable) |
| FR-06 User can confirm with “Yes, delete” | TC-DEL-001 | Requires confirmation dialog | BLOCKED (dialog unreachable) |
| FR-07 Agent is removed immediately after confirmation | TC-DEL-001 | Requires successful FR-06 | BLOCKED (delete execution unreachable) |

## Non-Functional and Business Rules Coverage

| Requirement/Rule | Test ID | State Strategy | Status |
|---|---|---|---|
| NFR-01 Explicit confirmation before destructive action | TC-DEL-002 | Reach confirmation dialog after selecting agent and initiating delete | BLOCKED |
| NFR-02 Immediate deletion effect after confirmation | TC-DEL-001 | Observe list immediately after confirm action | BLOCKED |
| BR-01 Deletion irreversible | TC-DEL-001 | Confirm deletion path then verify no undo in documented flow | BLOCKED |
| BR-02 Explicit user confirmation required | TC-DEL-002 | Check dialog + yes-delete action | BLOCKED |
| BR-03 Target must be existing visible/selectable agent | TC-DEL-001 | Existing rows are visible; selection fails due runtime crash | BLOCKED |

## Blocked Tests

- `TC-DEL-001`: full delete flow from agent selection to removal.
- `TC-DEL-002`: confirmation gate visibility before destructive action.

Blocking evidence:
- Monitor rows visible before selection:
  - `.playwright-cli/page-2026-02-23T08-09-22-264Z.yml`
- Row click crashes page into error boundary:
  - `.playwright-cli/page-2026-02-23T08-09-29-237Z.yml`
  - `.playwright-cli/page-2026-02-23T08-09-52-768Z.yml`
- Runtime console stack trace:
  - `.playwright-cli/console-2026-02-23T08-10-02-439Z.log`

## Risks

- Monitoring page has a deterministic crash on row selection, preventing destructive-action validation.
- Existing `MonitorPage` delete helper methods include assumed selectors and are not reliable until crash is fixed.
- False confidence risk if tests are fabricated without empirical selector/assertion evidence.

## Undefined Behavior

- Cancel behavior in delete confirmation (`SCN-NEG-01`) remains unspecified by source and unreachable in current UI state.
- Permission/authorization failure path for deletion remains unspecified and unexplored.
- Backend delete failure/retry behavior remains unspecified and unexplored.

## Explicit Assumptions

- `playwright.config.ts` test root (`AutoGPT/tests`) is authoritative for test authoring.
- `.auth/user-pool.json` users are valid for environment login.
- `/monitoring` is the effective monitor route in implementation.

## Delivery Status

- Delivered spec file: `delete-agent.blocked.spec.ts`
- Result expectation: skipped/blocked, no fabricated delete steps.
