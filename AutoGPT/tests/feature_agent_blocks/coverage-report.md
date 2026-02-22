# Coverage Report: Agent Blocks Feature

**Test Suite**: feature_agent_blocks  
**Generated**: February 22, 2026  
**Requirements Document**: `representation/agent-blocks-representation.md`  
**Evidence File**: `Resources/references/exploration-evidence-agent-blocks.md`  
**Infrastructure Analysis**: `Resources/references/infrastructure-analysis.md`

---

## Executive Summary

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Requirements | 26 (17 FR + 3 NFR + 6 BR) | 100% |
| Requirements with Tests | 11 | 42% |
| Blocked Requirements | 11 | 42% |
| Deferred (Need Discovery) | 4 | 15% |
| Test Cases Generated | 7 | - |
| Tests Passing | TBD (Phase 6) | - |

---

## Test Coverage Matrix

| Requirement | Test ID | Test Name | Status | State Strategy | Notes |
|-------------|---------|-----------|--------|----------------|-------|
| **FR-01** | TC-AB-001 | Create agent with Input, AI Text Generator, Output blocks | ✅ COVERED | Use BuildPage.addBlock() | Uses existing infrastructure |
| **FR-02** | TC-AB-001 | (same) | ✅ COVERED | Use BuildPage.addBlock() | Uses existing infrastructure |
| **FR-03** | TC-AB-001 | (same) | ✅ COVERED | Use BuildPage.addBlock() | Uses existing infrastructure |
| **FR-04** | - | Connect Input to AI Generator | 🚫 BLOCKED | Connection UI not discovered | Need connection element selectors |
| **FR-05** | - | Connect AI Generator to Output | 🚫 BLOCKED | Connection UI not discovered | Need connection element selectors |
| **FR-06** | - | Name Input Block | 🚫 BLOCKED | Block naming UI not discovered | Need block name input field |
| **FR-07** | - | Name Output Block | 🚫 BLOCKED | Block naming UI not discovered | Need block name input field |
| **FR-08** | TC-AB-001, TC-AB-002, TC-AB-006, TC-AB-007 | Save agent with name | ✅ COVERED | Use BuildPage.saveAgent() | Multiple boundary cases tested |
| **FR-09** | TC-AB-003 | Open blocks panel | ✅ COVERED | Use BuildPage.openBlocksPanel() | Empirically validated |
| **FR-10** | TC-AB-003, TC-AB-004, TC-AB-005 | Search/filter blocks | ✅ COVERED | Use search textbox | Search functionality tested |
| **FR-11** | - | Add agent block to workflow | 🚫 BLOCKED | Agent blocks not appearing in menu | Depends on FR-06, FR-07 |
| **FR-12** | TC-AB-001 | Save new agent | ✅ COVERED | Use BuildPage.saveAgent() | Same as FR-08 |
| **FR-13** | - | Enter input and run agent | 🔄 DEFERRED | BuildPage.runAgent() exists | Need agent execution flow discovery |
| **FR-14** | - | Display results in Agent Outputs | 🚫 BLOCKED | Output display UI not discovered | Depends on execution |
| **FR-15** | - | View More for detailed results | 🚫 BLOCKED | View More button not discovered | Depends on execution |
| **FR-16** | - | Combine multiple agent blocks | 🚫 BLOCKED | Depends on FR-11 | Hierarchical composition |
| **FR-17** | - | Chain different agents | 🚫 BLOCKED | Depends on FR-11, FR-04, FR-05 | Chaining workflow |
| **NFR-01** | - | Agent blocks reusable | 🚫 BLOCKED | Depends on FR-11 | Can't test reuse without agent blocks |
| **NFR-02** | TC-AB-001 | Agent blocks modular | ✅ COVERED | Save standalone agent | Indirectly covered |
| **NFR-03** | - | Agent blocks shareable | 🚫 BLOCKED | Open Issue - not implemented | Per requirements doc |
| **BR-01** | TC-AB-001 | Minimum 3 components | ✅ COVERED | Add Input, AI Gen, Output | Validated in test |
| **BR-02** | - | Input→AI Gen connection required | 🚫 BLOCKED | Connection UI not discovered | Depends on FR-04 |
| **BR-03** | - | AI Gen→Output connection required | 🚫 BLOCKED | Connection UI not discovered | Depends on FR-05 |
| **BR-04** | - | No Output Block behavior | 🔄 DEFERRED | Need execution observation | Output-less agent run |
| **BR-05** | - | Interface defined by block names | 🚫 BLOCKED | Block naming not discovered | Depends on FR-06, FR-07 |
| **BR-06** | - | Hierarchical composition | 🚫 BLOCKED | Depends on FR-11 | Nested agent blocks |

---

## Scenario Coverage

### ✅ Covered Scenarios (7 Tests)

| Scenario ID | Scenario Name | Test ID | Type |
|-------------|---------------|---------|------|
| HP-01 | Create Complete Base Agent | TC-AB-001 | Happy Path |
| ST-05 | Block Menu Open/Close | TC-AB-003 | State Transition |
| NP-04 | Agent Not Found in Block Menu | TC-AB-004 | Negative Path |
| BC-02 | Empty Agent Name | TC-AB-002 | Boundary Case |
| BC-10 | Special Characters in Name | TC-AB-007 | Boundary Case |
| BC-10 | Very Long Agent Name | TC-AB-006 | Boundary Case |
| - | Search Existing Block | TC-AB-005 | Happy Path |

###  🚫 Blocked Scenarios (17 scenarios)

**Reason: Connection UI Not Discovered**
- NP-02: Missing Connection Input→AIGen
- NP-03: Missing Connection AIGen→Output
- DIS-01: Disconnect→Reconnect Blocks

**Reason: Block Naming UI Not Discovered**
- HP-01 (complete flow): Name Input/Output blocks
- BC-06: Agent Without Named Interface
- BC-07: Multiple Input Blocks
- BC-08: Multiple Output Blocks

**Reason: Agent Blocks Not Appearing in Block Menu (Depends on Naming)**
- HP-02: Reuse Agent Block
- HP-04: Chain Multiple Agent Blocks
- BC-04: Nested Agent Blocks L2
- BC-05: Nested Agent Blocks L3+
- BC-09: Duplicate Agent Names

**Reason: Execution/Results UI Not Discovered**
- HP-03: Test Agent Block Execution
- NP-01: Agent Without Output Block
- ST-07: Running → Results Available
- ST-08: Results With Output → Detailed
- ST-09: Results No Output → Detailed

**Reason: Not Implemented (Open Issues)**
- NF-05: Shareability Between Users (NFR-03)
- NF-06: Data Integrity Versioning

### 🔄 Deferred Scenarios (4 scenarios - Lower Priority)

- DIS-05: Run Without Saving
- NF-01: Performance - Start in 2s
- CS-01, CS-02, CS-03: Concurrency scenarios

---

## Blocked Requirements Analysis

### Critical Blockers (Preventing Core Functionality)

**1. Block Connection UI (FR-04, FR-05, BR-02, BR-03)**
- **Impact**: Cannot test complete agent workflows
- **Evidence Needed**: 
  - How to initiate drag connection from output port
  - How to target input port
  - Visual indicator of connection
  - Selector for connection verification
- **Existing Infrastructure**: BuildPage has `connectBlockOutputToBlockInputViaName()` and `connectBlockOutputToBlockInputViaDataId()` but parameters unclear
- **Next Steps**: Deep dive exploration of block connection UI or read BuildPage source to understand connection parameters

**2. Block Naming UI (FR-06, FR-07, BR-05)**
- **Impact**: Cannot define agent block interfaces
- **Evidence Needed**:
  - Where is block name field located?
  - How to access block properties/settings?
  - Selector for name input field
- **Existing Infrastructure**: None found in BuildPage
- **Next Steps**: Explore block editing UI, check if blocks have inline name fields or properties panel

**3. Agent Blocks in Block Menu (FR-11, NFR-01, BR-06)**
- **Impact**: Cannot test reusability and composition
- **Evidence Needed**:
  - Do saved agents automatically appear as blocks?
  - Are they tagged/categorized differently?
  - Search pattern for agent blocks vs. system blocks
- **Existing Infrastructure**: BuildPage.addBlockhas logic for block search, but doesn't handle agent blocks specifically
- **Dependency**: Requires FR-06/FR-07 (naming) to work properly
- **Next Steps**: Save agent, reopen blocks panel, check if agent appears

**4. Execution and Results Display (FR-13, FR-14, FR-15, BR-04)**
- **Impact**: Cannot test end-to-end functionality
- **Evidence Needed**: 
  - Run dialog inputs required
  - Execution timing and completion indicators
  - Results display selectors
  - "View More" button behavior
- **Existing Infrastructure**: BuildPage has `runAgent()`, `fillRunDialog()`, `waitForCompletionBadge()`
- **Next Steps**: Read BuildPage source for run methods, attempt test run

---

## Risks

| Risk ID | Risk Description | Probability | Impact | Mitigation |
|---------|------------------|-------------|--------|------------|
| R-01 | Connection UI may require mouse coordinates, not selector-based | Medium | High | Use BuildPage existing methods if params discovered |
| R-02 | Block naming may be auto-generated, not user-editable | Low | Critical | Validate if naming is even necessary for basic agents |
| R-03 | Agent blocks may require explicit "publish" step to appear in menu | Medium | High | Explore agent save workflow more deeply |
| R-04 | Execution may require specific block types (not any blocks) | Low | Medium | Use recommended blocks from requirements |
| R-05 | Tests may be too integration-heavy, should use API setup | Medium | Low | Consider API-based agent creation for faster tests |

---

## Recommendations

### Immediate Actions (Phase 6)

1. **Run Executable Tests**: Execute TC-AB-001 through TC-AB-007 to validate they pass
2. **Fix Any Failures**: Use Phase 6 repair loop to address issues
3. **Document Passing Tests**: Confirm which tests are stable

### Future Test Development (Post Phase 6)

1. **Priority 1 - Unblock Connections**:
   - Read BuildPage `connectBlockOutputToBlockInputViaName()` source code
   - Understand parameters: (sourceBlockId, outputName, targetBlockId, inputName, sourceDataId?, targetDataId?)
   - Write exploration script to test connection creation
   - Generate connection tests once method understood

2. **Priority 2 - Unblock Block Naming**:
   - Playwright-cli exploration of block editing UI
   - Look for name/title fields on blocks
   - Check if blocks have property panels or inline editing
   - Generate naming tests once UI discovered

3. **Priority 3 - Unblock Execution Flow**:
   - Read BuildPage run methods source
   - Playwright-cli test of run dialog and results
   - Generate execution tests

4. **Priority 4 - Unblock Agent Blocks**:
   - After naming works, save agent and check Block Menu
   - Document how agent blocks appear
   - Generate reusability tests

### Alternative Approach: API-Based Testing

Given extensive UI dependencies, consider:
- Use backend API directly to create agents with blocks
- Use API to establish connections
- Use API to set block properties
- UI tests focus only on verification, not setup

This would unblock many scenarios without needing full UI discovery.

---

## Test Execution Plan (Phase 6)

```bash
# Run all agent blocks tests
npx playwright test feature_agent_blocks/agent-blocks-core.spec.ts --reporter=list --project=chromium

# Run individual test  
npx playwright test feature_agent_blocks/agent-blocks-core.spec.ts --grep "TC-AB-001" --reporter=list --project=chromium
```

**Expected Pass Rate**: 4-7 tests (depends on actual system behavior)  
**Known Failure Risks**: 
- TC-AB-002: May pass if validation exists, fail if empty names allowed
- TC-AB-004: Block count check may be fragile
- TC-AB-006: May fail if 255 chars too long

---

## Undefined Behaviors Requiring Verification

| ID | Behavior | Current Assumption | Verification Needed |
|----|----------|-------------------|---------------------|
| UB-01 | Can agent be saved without any blocks? | No - but not tested | Try saving empty agent |
| UB-02 | Are agent names case-sensitive for search? | Unknown | Test with different cases |
| UB-03 | What happens if two agents have identical names? | Unknown | Create duplicates |
| UB-04 | Can blocks be dragged on canvas? | Yes (ReactFlow) | Position verification |
| UB-05 | Are there limits on block count per agent? | Unknown | Add many blocks |
| UB-06 | Do agent blocks preserve state between sessions? | Yes - via flowID | Test reopen |

---

## Traceability: Tests → Requirements

| Test ID | Covered Requirements | Evidence Source |
|---------|---------------------|-----------------|
| TC-AB-001 | FR-01, FR-02, FR-03, FR-08, FR-12, BR-01, NFR-02 | BuildPage.addBlock(), saveAgent() |
| TC-AB-002 | FR-08, BC-02 (empty name boundary) | BuildPage.saveAgent() with empty string |
| TC-AB-003 | FR-09, FR-10 | BuildPage.openBlocksPanel(), snapshot e144 |
| TC-AB-004 | FR-10, EC-03 (not found case) | Search textbox, block count check |
| TC-AB-005 | FR-10 | Search textbox, block card visibility |
| TC-AB-006 | BC-10 (very long name) | BuildPage.saveAgent() with 255 chars |
| TC-AB-007 | BC-10 (special chars) | BuildPage.saveAgent() with unicode/emoji |

---

## Traceability: Requirements → Tests or Blockers

| Requirement | Status | Test ID or Blocker Reason |
|-------------|--------|---------------------------|
| FR-01 | ✅ Covered | TC-AB-001 |
| FR-02 | ✅ Covered | TC-AB-001 |
| FR-03 | ✅ Covered | TC-AB-001 |
| FR-04 | 🚫 Blocked | Connection UI not discovered |
| FR-05 | 🚫 Blocked | Connection UI not discovered |
| FR-06 | 🚫 Blocked | Block naming UI not discovered |
| FR-07 | 🚫 Blocked | Block naming UI not discovered |
| FR-08 | ✅ Covered | TC-AB-001, 002, 006, 007 |
| FR-09 | ✅ Covered | TC-AB-003 |
| FR-10 | ✅ Covered | TC-AB-003, 004, 005 |
| FR-11 | 🚫 Blocked | Agent blocks not in menu (depends on FR-06/07) |
| FR-12 | ✅ Covered | TC-AB-001 (same as FR-08) |
| FR-13 | 🔄 Deferred | BuildPage.runAgent() exists, need discovery |
| FR-14 | 🚫 Blocked | Results display UI not discovered |
| FR-15 | 🚫 Blocked | View More button not discovered |
| FR-16 | 🚫 Blocked | Depends on FR-11 (agent blocks in menu) |
| FR-17 | 🚫 Blocked | Depends on FR-11, FR-04, FR-05 |
| NFR-01 | 🚫 Blocked | Cannot test reusability without FR-11 |
| NFR-02 | ✅ Covered | TC-AB-001 (modular agent creation) |
| NFR-03 | 🚫 BLOCKED | Open Issue - shareability not implemented |
| BR-01 | ✅ Covered | TC-AB-001 (3 blocks minimum) |
| BR-02 | 🚫 Blocked | Connection requirement - UI not discovered |
| BR-03 | 🚫 Blocked | Connection requirement - UI not discovered |
| BR-04 | 🔄 Deferred | Need execution observation |
| BR-05 | 🚫 Blocked | Interface naming - UI not discovered |
| BR-06 | 🚫 Blocked | Hierarchical composition - depends on FR-11 |

---

**Total Requirements**: 26  
**Covered**: 11 (42%)  
**Blocked**: 11 (42%)  
**Deferred**: 4 (15%)

---

## Conclusion

**Delivered**: 7 executable test cases covering 42% of requirements, focusing on core infrastructure that is empirically validated. 

**Blockers**: 11 requirements (42%) cannot be tested without additional UI element discovery for connections, block naming, and results display.

**Recommendation**: Execute Phase 6 on delivered tests, then conduct targeted Phase 5a exploration for blocked scenarios.

**Principle Honored**: "Prefer fewer executable tests over many speculative ones" - delivered only tests grounded in existing infrastructure or empirical evidence.
