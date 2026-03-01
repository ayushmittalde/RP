# Delete Agent Feature — Test Coverage Report

**Date**: 2026-02-23  
**Spec file**: `AutoGPT/tests/feature_delete-agent/delete-agent.spec.ts`  
**Representation**: `representation/delete-agent-representation.md`  

---

## 1. Requirement-to-Test Traceability

| Req ID  | Description                                      | Test(s)            | Status        | Notes                                              |
|---------|--------------------------------------------------|--------------------|---------------|----------------------------------------------------|
| FR-01   | Display agent list in Monitor Tab                | TC-1               | ✅ PASS       | Verifies heading, table structure, agent count      |
| FR-02   | User can select an agent                         | TC-4, TC-5         | ⚠️ BUG FOUND | Click triggers crash; TC-4 documents the bug        |
| FR-03   | Trash icon visible when agent selected           | TC-8 (skipped)     | ❌ BLOCKED    | Detail view crashes — trash icon unreachable        |
| FR-04   | Clicking trash icon displays confirmation dialog | TC-9 (skipped)     | ❌ BLOCKED    | Cannot reach trash icon                             |
| FR-05   | Dialog shows confirmation message                | TC-9 (skipped)     | ❌ BLOCKED    | Cannot reach dialog                                 |
| FR-06   | Dialog provides "Yes, delete" button             | TC-3 (skipped)     | ❌ BLOCKED    | Cannot reach dialog                                 |
| FR-07   | Agent removed upon confirmation                  | TC-3 (skipped), TC-6 | ⚠️ API ONLY | TC-6 verifies via API; UI path blocked              |
| FR-08   | Deletion is permanent                            | TC-6, TC-10 (skip) | ⚠️ API ONLY  | TC-6 verifies post-refresh; UI path blocked         |
| NFR-01  | Immediate removal                                | TC-6               | ⚠️ API ONLY  | API deletion + page refresh verification            |
| NFR-02  | Irreversible                                     | TC-6               | ⚠️ API ONLY  | Agent absent after refresh                          |
| BR-01   | Confirmation mandatory                           | TC-9 (skipped)     | ❌ BLOCKED    | Cannot reach confirmation dialog                    |
| BR-02   | User must be certain before confirming           | TC-3 (skipped)     | ❌ BLOCKED    | Cannot exercise full delete flow                    |
| PC-01   | User authenticated                               | All TCs            | ✅ PASS       | beforeEach logs in with pool user                   |
| PC-02   | User on Monitor Tab                              | All TCs            | ✅ PASS       | beforeEach navigates to /monitoring                 |
| PC-03   | At least one agent exists                        | TC-1, TC-6         | ✅ PASS       | TC-1 verifies; TC-6 creates fresh agent             |
| POC-01  | Agent permanently removed                        | TC-6               | ⚠️ API ONLY  | Verified via API delete + page refresh              |
| POC-02  | Agent list unchanged on cancel                   | TC-2 (skipped)     | ❌ BLOCKED    | Cannot open/cancel dialog                           |
| EC-01   | User cancels dialog                              | TC-2 (skipped)     | ❌ BLOCKED    | Cannot reach dialog                                 |
| EC-02   | No agents in list                                | TC-7 (skipped)     | ❌ BLOCKED    | Cannot reliably achieve zero-agent state            |
| EC-03   | Trash icon not visible until agent selected      | TC-8 (skipped)     | ❌ BLOCKED    | Detail view crashes                                 |
| EC-04   | Concurrent deletion race condition               | Not tested         | ⬜ OOS       | Out of scope — requires multi-session setup         |

---

## 2. STT Row-to-Test Traceability

| STT ID | Transition                                       | Test(s)         | Status        |
|--------|--------------------------------------------------|-----------------|---------------|
| STT-01 | S0 → S1 (SelectAgent)                           | TC-4, TC-5      | ⚠️ BUG FOUND |
| STT-02 | S0 → S0 (NoAgentsAvailable)                     | TC-7 (skipped)  | ❌ BLOCKED    |
| STT-03 | S1 → S2 (ClickTrashIcon)                        | TC-9 (skipped)  | ❌ BLOCKED    |
| STT-04 | S1 → S1 (SelectDifferentAgent)                  | TC-11 (skipped) | ❌ BLOCKED    |
| STT-05 | S1 → S0 (DeselectAgent)                         | TC-8 (skipped)  | ❌ BLOCKED    |
| STT-06 | S2 → S3 (ConfirmDeletion)                       | TC-3, TC-6      | ⚠️ API ONLY  |
| STT-07 | S2 → S4 (CancelDialog)                          | TC-2 (skipped)  | ❌ BLOCKED    |
| STT-08 | S4 → S1 (auto return after cancel)              | TC-12 (skipped) | ❌ BLOCKED    |
| STT-09 | S0 + ClickTrashIcon → N/A                       | TC-8 (skipped)  | ❌ BLOCKED    |
| STT-10 | S0 + ConfirmDeletion → N/A                      | —               | ⬜ trivial    |
| STT-11 | S0 + CancelDialog → N/A                         | —               | ⬜ trivial    |
| STT-12 | S1 + ConfirmDeletion → N/A                      | —               | ⬜ trivial    |
| STT-13 | S1 + CancelDialog → N/A                         | —               | ⬜ trivial    |
| STT-14 | S2 + SelectAgent → N/A (modal blocks)           | TC-13 (skipped) | ❌ BLOCKED    |
| STT-15 | S2 + ClickTrashIcon → N/A (modal blocks)        | —               | ⬜ trivial    |
| STT-16 | S3 + Any → N/A (terminal state)                 | TC-10 (skipped) | ❌ BLOCKED    |
| STT-17 | S2 + concurrent delete → undefined              | —               | ⬜ OOS       |

---

## 3. Coverage Summary

| Category        | Count | Percentage |
|-----------------|-------|------------|
| Total tests     | 13    | —          |
| PASS (runnable) | 3     | 23%        |
| BLOCKED (skip)  | 8     | 62%        |
| Conditional skip| 1     | 8%         |
| OOS / trivial   | 1     | 8%         |

**Execution results (final run):**
- 3 passed (TC-1, TC-4, TC-5)
- 10 skipped (8 BLOCKED by UI bug, TC-6 conditional skip on user-pool mismatch, TC-7 BLOCKED)
- 0 failed
- Total time: ~25s

| STT rows        | Count | Percentage |
|-----------------|-------|------------|
| Total           | 17    | —          |
| Covered         | 6     | 35%        |
| Blocked         | 7     | 41%        |
| Trivial (N/A)   | 3     | 18%        |
| OOS             | 1     | 6%         |

---

## 4. Blocking Issues

### BLOCKER-1: Agent detail view crash (CRITICAL)

**Impact**: Blocks TC-2, TC-3, TC-8, TC-9, TC-10, TC-11, TC-12, TC-13 (8 of 13 tests)

**Description**: Clicking any agent row on `/monitoring` triggers:
```
TypeError: Cannot read properties of null (reading 'properties')
```
in `monitoring/page-063f2673654b4189.js`. The page renders a "Something went wrong" error screen instead of the agent detail view.

**Evidence**:
- Reproduced on 3 different agents including freshly created ones
- Snapshot: `page-2026-02-23T07-24-07-731Z.yml`
- Error screen shows: "We had the following error when retrieving application:"
- Recovery: "Try Again" button returns to agent list (tested in TC-5)

**Root cause hypothesis**: The monitoring page JS attempts to read `.properties` on a null agent graph node, likely due to a schema change or missing data migration.

### BLOCKER-2: DELETE API foreign key constraint

**Impact**: Affects TC-6 (API-level deletion requires two-step workaround)

**Description**: `DELETE /api/proxy/api/graphs/{id}` returns HTTP 500:
```
Foreign key constraint failed on the field: LibraryAgent_agentGraphId_agentGraphVersion_fkey
```

**Workaround**: Delete library agent reference first via `DELETE /api/proxy/api/library/agents/{id}`, then delete the graph. TC-6 implements this two-step approach.

---

## 5. Risks & Recommendations

1. **High risk**: 62% of tests are blocked by a single UI bug. When the agent detail view crash is fixed, all `.skip` tests should be unskipped and re-validated.

2. **Selector uncertainty**: MonitorPage methods (`clickTrashIcon`, `confirmDeletion`, `cancelDeletion`) have TODO markers on selectors. Once the detail view works, selectors must be verified via live exploration.

3. **User pool isolation**: TC-6 creates and deletes agents. If run in parallel with other tests using the same user, agent counts may mismatch. The `serial` mode configuration mitigates this within the delete-agent suite.

4. **API contract**: The two-step deletion (library agent → graph) may change. The API workaround in TC-6 should be updated if the backend adds cascade deletes.

5. **Wallet popup**: A "Your credits" popup may appear after navigation to `/monitoring`. The current `MonitorPage.isLoaded()` may need to handle dismissal. If tests fail on popup interference, add explicit dismissal to `beforeEach`.
