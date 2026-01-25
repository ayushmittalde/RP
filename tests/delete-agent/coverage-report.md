**Coverage Report — Delete Agent Feature**
- Suite files: [tests/delete-agent/delete-agent.happy.spec.js](tests/delete-agent/delete-agent.happy.spec.js), [tests/delete-agent/delete-agent.ui.spec.js](tests/delete-agent/delete-agent.ui.spec.js), [tests/delete-agent/delete-agent.edge.spec.js](tests/delete-agent/delete-agent.edge.spec.js), [tests/delete-agent/delete-agent.error.spec.js](tests/delete-agent/delete-agent.error.spec.js)
- Executable tests: TC-001, TC-002, TC-003, TC-004, TC-005, TC-006, TC-007, TC-008, TC-009, TC-013
- Deferred (fixme) tests: TC-010 (empty state), TC-011 (permission denial), TC-012 (active-agent policy), TC-014 (monitor-only control)
- Shared assumptions: monitor route `/monitor` is reachable post-login; fixture import works; delete API pattern matches `**/agents/**`; thresholds set to 2000ms for NFR-3.

**Functional Requirements (FR) Coverage**
- FR-1 Navigate to Monitor Tab: TC-001, TC-002, TC-003, TC-006, TC-007, TC-008, TC-009
- FR-2 View list of agents: TC-001, TC-002, TC-003, TC-007, TC-009; partial: TC-010 (fixme) for empty state
- FR-3 Select agent: TC-001, TC-002, TC-003, TC-007, TC-009
- FR-4 Locate/click trash icon: TC-001, TC-002, TC-003, TC-004
- FR-5 Show confirmation dialog: TC-001, TC-002, TC-005, TC-008; pending active-agent variant (TC-012 fixme)
- FR-6 Confirm deletion: TC-001, TC-003, TC-005, TC-006, TC-007, TC-009, TC-013; policy pending for active runs (TC-012 fixme)
- FR-7 Remove from list immediately: TC-001, TC-003, TC-006, TC-007, TC-009, TC-013; boundary for last-agent empty state pending (TC-010 fixme)
- FR-8 Trash icon on right: TC-004

**Non-Functional Requirements (NFR) Coverage**
- NFR-1 Irreversibility: TC-001 (post-reload absence); needs audit/log verification and API-level assertion
- NFR-2 Warning before delete: TC-005 (dialog copy/buttons)
- NFR-3 Immediate update: TC-001, TC-006 (<=2s budget), TC-007 (retry flow), TC-013 (duplicate-click guard)
- NFR-4 Visual affordance/usability: TC-004 (placement + aria), TC-008 (keyboard cancel)

**Business Rules (BR) Coverage**
- BR-1 No recovery: TC-001; deeper audit logging pending
- BR-2 Confirmation mandatory: TC-005
- BR-3 Deletion only via Monitor Tab: TC-014 fixme (needs confirmation outside Monitor)
- BR-4 User must have access: blocked pending non-privileged account (TC-011 fixme)

**Edge Cases (EC) Coverage**
- EC-1 Cancel deletion: TC-002, TC-008
- EC-2 Last agent deleted → empty state: TC-010 fixme (needs isolated dataset)
- EC-3 Active agent deletion policy: TC-012 fixme (needs policy/ability to start run)
- EC-4 Concurrent delete same agent: TC-009
- EC-5 Network interruption: TC-007 (500 then retry)
- EC-6 No agents to delete: TC-010 fixme
- EC-7 No permission to delete: TC-011 fixme

**Subagent-Derived Scenarios**
- SA-1 Performance budget: TC-006
- SA-2 Retry after failure: TC-007
- SA-4 Concurrent delete handling: TC-009
- SA-6 Double-click/duplicate guard: TC-013
- SA-7 Persist after reload: TC-001
- SA-9 Keyboard cancel focus: TC-008
- SA-10 Localization: not yet covered
- SA-11 Error-state cancel: partially in TC-007 (toast) but dedicated dialog cancel missing
- SA-15 Icon accessibility/right alignment: TC-004
- Other SA items (permission revocation, session timeout, audit logging) remain open for future iterations

**Gaps / Blockers**
- Data isolation needed to validate empty-state and last-agent flows (TC-010)
- Non-privileged test user required to exercise BR-4/EC-7 (TC-011)
- Running-agent policy undefined (TC-012)
- Localization and error-dialog dismiss paths not yet automated
- Audit/log verification for irreversibility not implemented

**New Risks & Assumptions**
- Delete API endpoint pattern may differ; route matching `**/agents/**` could miss or over-match calls
- Fixture-based agent import is assumed stable; failures would block setup across tests
- Performance budget set to 2s from SA-1 assumption; adjust if product defines different SLA
- Concurrency test assumes shared credentials can sign into multiple contexts without rate limiting
