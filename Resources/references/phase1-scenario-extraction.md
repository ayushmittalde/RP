# Phase 1: Scenario Extraction - Delete Agent Feature

**Date**: February 8, 2026  
**Source**: test_6.md structured representation  
**Approach**: Extract explicit + implicit scenarios using system-breaker mindset

---

## Explicitly Documented Scenarios (from Gherkin)

### S1: Happy Path - Successful Deletion
**Source**: Scenario 1 in test_6.md  
**Requirements**: FR-1 to FR-8, NFR-1 to NFR-3, BR-1, BR-2  
**Description**: User successfully deletes an agent with confirmation  
**Flow**:
1. Navigate to Monitor Tab
2. View agent list
3. Select agent
4. See trash icon on right
5. Click trash icon
6. See confirmation dialog
7. Click "Yes, delete"
8. Agent immediately removed
9. Agent permanently deleted

---

### S2: Cancellation Path
**Source**: Scenario 2 in test_6.md  
**Requirements**: FR-1 to FR-5, EC-1  
**Description**: User cancels agent deletion  
**Flow**:
1. Navigate to Monitor Tab
2. Select agent
3. Click trash icon
4. See confirmation dialog
5. Click "Cancel" or dismiss dialog
6. Dialog closes
7. Agent remains in list
8. No changes made

---

### S3: Empty State
**Source**: Scenario 3 in test_6.md  
**Requirements**: FR-1, FR-2, EC-6  
**Description**: View Monitor Tab with no agents  
**Flow**:
1. Navigate to Monitor Tab
2. No agents in system
3. See empty state message
4. No trash icons visible
5. Cannot delete any agents

---

### S4: Last Agent Deletion
**Source**: Scenario 4 in test_6.md  
**Requirements**: FR-1 to FR-7, EC-2  
**Description**: Delete the last remaining agent  
**Flow**:
1. Navigate to Monitor Tab
2. Exactly one agent exists
3. Select and delete agent
4. Agent removed
5. Empty state shown
6. Agent count = 0

---

### S5: Multiple Agents - Delete One
**Source**: Scenario 5 in test_6.md  
**Requirements**: FR-1 to FR-7, NFR-3  
**Description**: Delete one agent when multiple exist  
**Flow**:
1. Navigate to Monitor Tab
2. Multiple agents exist
3. Delete specific agent
4. Only that agent removed
5. Other agents remain
6. Agent count decremented

---

### S6: Visual Affordance Check
**Source**: Scenario 6 in test_6.md  
**Requirements**: FR-4, FR-8, NFR-4  
**Description**: Verify trash icon positioning and visibility  
**Flow**:
1. Navigate to Monitor Tab
2. Select any agent
3. Trash icon visible
4. Positioned on right side
5. Clearly clickable

---

### S7: Confirmation Dialog Content
**Source**: Scenario 7 in test_6.md  
**Requirements**: FR-5, NFR-2, BR-2  
**Description**: Verify confirmation dialog safety  
**Flow**:
1. Navigate to Monitor Tab
2. Select agent
3. Click trash icon
4. Dialog appears with exact message
5. "Yes, delete" button present
6. Cancel/close option present
7. Agent NOT deleted until confirmed

---

### S8: Deletion Error Handling
**Source**: Scenario 8 in test_6.md  
**Requirements**: EC-5  
**Description**: Handle deletion failure due to network error  
**Flow**:
1. Navigate to Monitor Tab
2. Select agent
3. Confirm deletion
4. Deletion request fails
5. Error message shown
6. Agent still in list
7. Can retry deletion

---

### S9: Irreversibility Validation
**Source**: Scenario 9 in test_6.md  
**Requirements**: NFR-1, BR-1  
**Description**: Verify deleted agent cannot be recovered  
**Flow**:
1. Delete agent with confirmation
2. Agent permanently removed from database
3. No recovery possible
4. Agent not in any list
5. Access by ID returns error

---

### S10: Performance - Immediate Deletion
**Source**: Scenario 10 in test_6.md  
**Requirements**: FR-7, NFR-3  
**Description**: Verify immediate removal after confirmation  
**Flow**:
1. Select and confirm deletion
2. Agent removed immediately
3. Removal within 2 seconds
4. No page refresh needed

---

## Additional Discovered Scenarios (System-Breaker Analysis)

### S11: Navigate Away During Dialog
**Type**: Negative / User Error  
**Description**: User navigates away while confirmation dialog is open  
**Flow**:
1. Open deletion confirmation dialog
2. Navigate to different tab (Library, Build, etc.)
3. Verify dialog closes
4. Verify agent NOT deleted
5. Verify no system errors

**Why Important**: Tests dialog cleanup and navigation safety

---

### S12: Rapid Multiple Delete Attempts
**Type**: Concurrency / Race Condition  
**Description**: User clicks trash icon multiple times rapidly  
**Flow**:
1. Select agent
2. Click trash icon rapidly multiple times
3. Verify only ONE dialog appears
4. Verify deletion happens only once
5. No duplicate delete requests

**Why Important**: Prevents double-deletion bugs and API spam

---

### S13: Delete Dialog - Keyboard Interaction
**Type**: Accessibility / UX  
**Description**: Confirm/cancel deletion using keyboard  
**Flow**:
1. Open deletion dialog
2. Press Enter → Should confirm (if focused on "Yes, delete")
3. Press Escape → Should cancel
4. Tab navigation should work
5. Focus trap within dialog

**Why Important**: Accessibility requirement, keyboard users

---

### S14: Delete Non-Existent Agent (Stale State)
**Type**: Edge Case / Race Condition  
**Description**: Agent deleted by another session, then user tries to delete  
**Flow**:
1. User A opens Monitor Tab (sees Agent X)
2. User B deletes Agent X
3. User A (stale view) tries to delete Agent X
4. System should handle gracefully (error or refresh)

**Why Important**: Multi-session data consistency

---

### S15: Delete Agent With Active Runs
**Type**: Business Logic / State Constraint  
**Description**: Attempt to delete agent that has active/running executions  
**Flow**:
1. Agent has active run in progress
2. User attempts to delete agent
3. System behavior: Allow with warning? Prevent? Force stop?

**Why Important**: Clarifies business rule for EC-3 (currently TBD)

---

### S16: Delete Agent With Scheduled Runs
**Type**: Business Logic / State Constraint  
**Description**: Attempt to delete agent that has scheduled future runs  
**Flow**:
1. Agent has scheduled executions
2. User attempts to delete agent
3. Schedules should be deleted as well
4. Or warn user about schedules

**Why Important**: Data integrity, cascade deletion

---

### S17: Delete Agent - UI Refresh After External Change
**Type**: State Synchronization  
**Description**: Agent list updates when agent deleted elsewhere  
**Flow**:
1. User on Monitor Tab
2. Agent deleted via API or another session
3. Monitor Tab should reflect change (polling/refresh)

**Why Important**: UI consistency

---

### S18: Trash Icon Not Visible for Read-Only Users
**Type**: Permission / Access Control  
**Description**: Users without delete permission shouldn't see trash icon  
**Flow**:
1. User without delete permission navigates to Monitor Tab
2. Agents visible but trash icons hidden
3. Cannot trigger deletion

**Why Important**: Addresses EC-7 (permission requirements)

---

### S19: Delete Agent - Confirmation Message Includes Agent Name
**Type**: UX / Safety Enhancement  
**Description**: Confirmation dialog should show which agent is being deleted  
**Flow**:
1. Select agent "MyAgent"
2. Click trash icon
3. Dialog shows "Are you sure you want to delete 'MyAgent'?"
4. Prevents accidental wrong agent deletion

**Why Important**: User safety, better than generic message

---

### S20: Delete Multiple Agents Sequentially
**Type**: Workflow / Batch Operation  
**Description**: Delete multiple agents one after another  
**Flow**:
1. Select and delete Agent A → Success
2. Immediately select and delete Agent B → Success
3. No interference between operations
4. List updates correctly each time

**Why Important**: Real-world usage pattern

---

### S21: Network Interruption Mid-Delete
**Type**: Error Handling / Network Resilience  
**Description**: Network drops during delete API call  
**Flow**:
1. User confirms deletion
2. Network interrupted during DELETE request
3. System shows loading/error state
4. Agent state uncertain (deleted or not?)
5. Retry or refresh needed

**Why Important**: Addresses EC-5, real-world failure mode

---

### S22: Delete Agent - Loading State During Deletion
**Type**: UX / State Visibility  
**Description**: User sees loading indicator during deletion  
**Flow**:
1. Confirm deletion
2. Loading spinner or disabled state shown
3. Cannot trigger another action on same agent
4. Loading clears on success/error

**Why Important**: Prevents user confusion and duplicate actions

---

### S23: Delete Agent - Undo Immediately After (if applicable)
**Type**: UX / Recovery  
**Description**: If system has undo buffer, test immediate undo  
**Flow**:
1. Delete agent
2. "Undo" button appears briefly
3. Click undo → Agent restored
4. OR: Confirm no undo exists per NFR-1

**Why Important**: Clarifies NFR-1 (irreversibility) - likely no undo, but should verify

---

### S24: Page Load State - Navigate Directly to Monitor Tab
**Type**: Navigation / State  
**Description**: User navigates directly to /monitoring URL  
**Flow**:
1. User types /monitoring in browser
2. Page loads successfully
3. Agent list loads
4. All delete functionality works

**Why Important**: Direct URL navigation vs. in-app navigation

---

### S25: Trash Icon Accessibility - Screen Reader
**Type**: Accessibility  
**Description**: Screen reader can announce and activate trash icon  
**Flow**:
1. Navigate to Monitor Tab with screen reader
2. Trash icon has proper ARIA label
3. Can be activated via screen reader
4. Dialog properly announced

**Why Important**: WCAG compliance, accessibility

---

## Scenario Summary

| Category | Count | Scenarios |
|----------|-------|-----------|
| Explicitly Documented | 10 | S1-S10 |
| Additional Discovered | 15 | S11-S25 |
| **Total** | **25** | |

### By Type
- Happy Path: 3 (S1, S5, S20)
- Negative/Cancellation: 3 (S2, S11, S13)
- Edge Cases: 7 (S3, S4, S12, S14, S15, S16, S21)
- Error Handling: 3 (S8, S21, S22)
- Validation/Safety: 5 (S7, S9, S10, S19, S23)
- UI/UX: 5 (S6, S13, S19, S22, S24)
- Accessibility: 2 (S13, S25)
- Permissions: 1 (S18)
- State Sync: 2 (S17, S24)
- Business Logic: 2 (S15, S16)
- Performance: 1 (S10)

---

## Scenarios Requiring Clarification (TBD)

These scenarios cannot be fully implemented without business decisions:

| ID | Scenario | Blocker | Needs Decision From |
|----|----------|---------|---------------------|
| S15 | Delete agent with active runs | EC-3 not specified | Product Owner |
| S16 | Delete agent with schedules | Cascade behavior unknown | Product Owner |
| S18 | Permission-based deletion | Permission model undefined (EC-7) | Security/Product |
| S21 | Network interruption | Retry strategy undefined | Engineering |
| S23 | Undo functionality | Conflicts with NFR-1? | Product Owner |
| S14 | Concurrent deletion (multi-user) | EC-4 not specified | Engineering |

**Recommendation**: Proceed with clearly defined scenarios (S1-S13, S17, S19-S20, S22, S24-S25). Mark TBD scenarios as BLOCKED until clarification.

---

## Destructive Test Focus

As a system-breaker, prioritize these high-risk scenarios:

1. **S12**: Rapid clicks (race condition)
2. **S14**: Stale state (concurrent deletion)
3. **S21**: Network failure (data integrity)
4. **S15**: Delete active agent (business logic violation?)
5. **S11**: Navigate during dialog (state cleanup)

These are most likely to reveal bugs.

---

**Next Phase**: State Dependency Analysis for executable scenarios

