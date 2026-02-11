# Phase 2: State Dependency Analysis - Delete Agent Feature

**Date**: February 8, 2026  
**Purpose**: Determine required system state BEFORE each test begins  
**Critical Rule**: No assumptions - every dependency must be explicitly established

---

## State Dependency Table

| Scenario ID | Scenario Name | Required System State | State Components |
|-------------|---------------|----------------------|------------------|
| **S1** | Happy Path - Successful Deletion | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user<br>✅ User has delete permission<br>✅ Agent is in deletable state | User, Auth, Agent (1+) |
| **S2** | Cancellation Path | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user | User, Auth, Agent (1+) |
| **S3** | Empty State | ✅ User exists<br>✅ User authenticated<br>✅ **ZERO agents exist for user** | User, Auth, No Agents |
| **S4** | Last Agent Deletion | ✅ User exists<br>✅ User authenticated<br>✅ **EXACTLY 1 agent exists**<br>✅ Agent belongs to user | User, Auth, Agent (exactly 1) |
| **S5** | Multiple Agents - Delete One | ✅ User exists<br>✅ User authenticated<br>✅ **3+ agents exist**<br>✅ All agents belong to user<br>✅ Known agent names/ids | User, Auth, Agents (3+) |
| **S6** | Visual Affordance Check | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user | User, Auth, Agent (1+) |
| **S7** | Confirmation Dialog Content | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user | User, Auth, Agent (1+) |
| **S8** | Deletion Error Handling | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user<br>⚠️ **Ability to simulate network failure** | User, Auth, Agent (1+), Mock/Intercept |
| **S9** | Irreversibility Validation | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user<br>✅ Known agent ID for verification | User, Auth, Agent (1+), ID tracking |
| **S10** | Performance - Immediate Deletion | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user<br>✅ Performance measurement capability | User, Auth, Agent (1+), Timing |
| **S11** | Navigate Away During Dialog | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user | User, Auth, Agent (1+) |
| **S12** | Rapid Multiple Delete Attempts | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user | User, Auth, Agent (1+) |
| **S13** | Delete Dialog - Keyboard Interaction | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user<br>✅ Keyboard navigation enabled | User, Auth, Agent (1+) |
| **S14** | Delete Non-Existent Agent | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists initially<br>⚠️ **Ability to delete agent externally** | User, Auth, Agent (1+), API access |
| **S15** | Delete Agent With Active Runs | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ **Agent has active run in progress**<br>⚠️ **Ability to start/maintain running state** | User, Auth, Agent (1+), Active Run |
| **S16** | Delete Agent With Schedules | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ **Agent has scheduled future runs**<br>⚠️ **Ability to create schedules** | User, Auth, Agent (1+), Schedules |
| **S17** | UI Refresh After External Change | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>⚠️ **Ability to delete agent externally**<br>⚠️ **UI polling/refresh mechanism** | User, Auth, Agent (1+), API access |
| **S18** | Read-Only User Permissions | ✅ **Read-only user exists**<br>✅ Read-only user authenticated<br>✅ At least 1 agent visible<br>⚠️ **Permission system configured** | Special User, Auth, Agent (1+), Permissions |
| **S19** | Confirmation Includes Agent Name | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ **Agent has known, unique name** | User, Auth, Agent (1+ with name) |
| **S20** | Delete Multiple Sequentially | ✅ User exists<br>✅ User authenticated<br>✅ **At least 2 agents exist**<br>✅ All agents belong to user | User, Auth, Agents (2+) |
| **S21** | Network Interruption Mid-Delete | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user<br>⚠️ **Ability to interrupt network** | User, Auth, Agent (1+), Network Mock |
| **S22** | Loading State During Deletion | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>✅ Agent belongs to user<br>⚠️ **Ability to slow down request** | User, Auth, Agent (1+), Network Delay |
| **S23** | Undo Immediately After | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>⚠️ **Undo feature exists (unlikely)** | User, Auth, Agent (1+), Undo System |
| **S24** | Direct URL Navigation | ✅ User exists<br>✅ User authenticated (via session/cookie)<br>✅ At least 1 agent exists | User, Auth, Agent (1+) |
| **S25** | Screen Reader Accessibility | ✅ User exists<br>✅ User authenticated<br>✅ At least 1 agent exists<br>⚠️ **Screen reader testing tools** | User, Auth, Agent (1+), A11y Tools |

---

## Critical State Dependencies Breakdown

### Universal Dependencies (ALL scenarios)

| Dependency | Required For | Establishment Method |
|------------|--------------|---------------------|
| **User Exists** | All scenarios | ✅ `getTestUser()` from user pool |
| **User Authenticated** | All scenarios | ✅ `LoginPage.login()` in beforeEach |
| **Monitor Tab Loaded** | All scenarios | ✅ `page.goto("/monitoring")` + `MonitorPage.isLoaded()` |

### Agent-Related Dependencies

| Dependency | Required For | Quantity | Establishment Method |
|------------|--------------|----------|---------------------|
| **At least 1 agent** | S1, S2, S6-S14, S17, S19, S21-S25 | 1+ | ⚠️ **NEEDS STRATEGY** |
| **Exactly 1 agent** | S4 | Exactly 1 | ⚠️ **NEEDS STRATEGY** |
| **Multiple agents (2+)** | S20 | 2+ | ⚠️ **NEEDS STRATEGY** |
| **Multiple agents (3+)** | S5 | 3+ | ⚠️ **NEEDS STRATEGY** |
| **Zero agents** | S3 | 0 | ✅ Default state for new user OR cleanup |
| **Agent with known name** | S19 | 1+ | ✅ Create agent with specific name |
| **Agent with known ID** | S9, S14 | 1+ | ✅ Track ID after creation |

### Special State Dependencies

| Dependency | Required For | Complexity | Establishment Method |
|------------|--------------|------------|---------------------|
| **Active run in progress** | S15 | HIGH | ⚠️ **TBD - requires run API** |
| **Scheduled runs** | S16 | MEDIUM | ⚠️ **TBD - requires schedule API** |
| **Network failure simulation** | S8, S21 | MEDIUM | ✅ Playwright `route.abort()` |
| **Network delay simulation** | S22 | LOW | ✅ Playwright `route.fulfill({ delay })` |
| **External API access** | S14, S17 | LOW | ✅ `page.request.delete()` |
| **Read-only user** | S18 | HIGH | ⚠️ **TBD - permission system** |
| **Undo system** | S23 | UNKNOWN | ❌ **BLOCKED - likely doesn't exist** |
| **Screen reader tools** | S25 | HIGH | ⚠️ **TBD - requires axe-core or similar** |

---

## State Establishment Challenges

### Challenge 1: Agent Creation (CRITICAL)

**Problem**: Tests require agents to exist, but how to create them?

**Options**:
1. ✅ **Import from file** (existing `MonitorPage.importFromFile()`)
   - Pros: Works, already implemented
   - Cons: Slower, requires test fixture files
   
2. ⚠️ **Create via API** (PREFERRED but unknown)
   - Pros: Fast, deterministic
   - Cons: API endpoint unknown, may not exist
   
3. ⚠️ **Navigate to Build page and create**
   - Pros: Tests real workflow
   - Cons: VERY slow, complex, unreliable
   
4. ⚠️ **Use existing agents** (assume they exist)
   - Pros: Fast
   - Cons: **FORBIDDEN - violates no-assumption rule**

**Decision Required**: Investigate agent creation API or use import method

---

### Challenge 2: Zero Agents State (S3)

**Problem**: How to ensure user has ZERO agents?

**Options**:
1. ✅ **Create fresh user with no agents**
   - Pros: Clean state
   - Cons: Requires fresh user creation
   
2. ⚠️ **Delete all existing agents in beforeEach**
   - Pros: Cleanup
   - Cons: Requires knowing how to delete (circular dependency!)
   
3. ✅ **Use special test user that never creates agents**
   - Pros: Consistent
   - Cons: Requires dedicated user

**Recommended**: Create fresh user for S3 test only

---

### Challenge 3: Exactly N Agents (S4, S5)

**Problem**: Tests require EXACT agent counts

**Solution**:
1. In `beforeEach`: Create agents until count = N
2. Use agent creation helper (once established)
3. Track created agent IDs for cleanup

**Implementation**:
```typescript
async ensureExactAgentCount(count: number): Promise<Agent[]> {
  const currentAgents = await monitorPage.listAgents();
  
  // Delete excess
  while (currentAgents.length > count) {
    await monitorPage.deleteAgent(currentAgents.pop());
  }
  
  // Create missing
  while (currentAgents.length < count) {
    const agent = await createTestAgent(); // TBD
    currentAgents.push(agent);
  }
  
  return currentAgents;
}
```

---

### Challenge 4: Network Simulation (S8, S21, S22)

**Problem**: Need to simulate network conditions

**Solution**: ✅ Playwright `page.route()` - well-documented pattern

```typescript
// S8: Network failure
await page.route('**/api/agents/**', route => route.abort());

// S22: Slow network
await page.route('**/api/agents/**', route => 
  route.fulfill({ delay: 3000 }));
```

**Status**: Feasible, no blocker

---

### Challenge 5: Active Runs & Schedules (S15, S16)

**Problem**: Requires creating runs/schedules

**Investigation Needed**:
- How to start an agent run programmatically?
- How to create a schedule?
- Are there APIs for this?

**Temporary Status**: ⚠️ **RISKY** - may need to BLOCK these scenarios

---

### Challenge 6: Permission System (S18)

**Problem**: Requires read-only user

**Investigation Needed**:
- Does permission system exist?
- How to create read-only user?
- Or is this future functionality?

**Temporary Status**: ⚠️ **RISKY** - may need to BLOCK this scenario

---

## State Dependency Matrix: Feasibility Assessment

| State Requirement | Feasibility | Confidence | Notes |
|-------------------|-------------|------------|-------|
| User exists | ✅ Easy | 100% | `getTestUser()` |
| User authenticated | ✅ Easy | 100% | `LoginPage.login()` |
| Monitor Tab loaded | ✅ Easy | 100% | `page.goto()` + `isLoaded()` |
| Agent exists (1+) | ⚠️ Medium | 60% | Need creation strategy |
| Exact agent count | ⚠️ Medium | 60% | Need creation + deletion |
| Zero agents | ✅ Easy | 80% | Fresh user or cleanup |
| Network simulation | ✅ Easy | 100% | Playwright `route()` |
| External API delete | ✅ Easy | 90% | `page.request.delete()` |
| Active runs | ⚠️ Hard | 30% | Unknown API |
| Schedules | ⚠️ Hard | 30% | Unknown API |
| Read-only user | ⚠️ Hard | 20% | Unknown if exists |
| Undo system | ❌ Blocked | 0% | Likely doesn't exist |
| Screen reader tools | ⚠️ Medium | 50% | Requires axe-core |

---

## Dependency Graph

```
┌─────────────────┐
│  Test User      │ ◄─── getTestUser()
│  (Authenticated)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Monitor Tab    │ ◄─── page.goto("/monitoring")
│  Loaded         │      monitorPage.isLoaded()
└────────┬────────┘
         │
         ├─────────► ⚠️ Agent Creation (NEEDS SOLUTION)
         │           ├─► Import from file (slow)
         │           ├─► Create via API (unknown)
         │           └─► Navigate to Build (too slow)
         │
         ├─────────► ✅ Network Mocking (Playwright route)
         │
         ├─────────► ⚠️ External API Access (page.request)
         │
         └─────────► ⚠️ Special States (runs, schedules, permissions)
                     (Investigation Required)
```

---

## Critical Blockers Summary

### BLOCKER 1: Agent Creation Strategy (HIGH PRIORITY)
- **Impact**: Affects 22 of 25 scenarios
- **Required For**: S1-S2, S4-S14, S17, S19-S22, S24-S25
- **Action**: Must decide on agent creation method BEFORE Phase 5
- **Options**:
  1. Use `MonitorPage.importFromFile()` (safe but slow)
  2. Investigate agent creation API
  3. Implement Page Object helper to create in Build page

### BLOCKER 2: Active Runs & Schedules (MEDIUM PRIORITY)
- **Impact**: Affects 2 scenarios
- **Required For**: S15, S16
- **Action**: Investigate run/schedule APIs or BLOCK scenarios
- **Fallback**: Mark as RISKY/BLOCKED if no API found

### BLOCKER 3: Permission System (LOW PRIORITY)
- **Impact**: Affects 1 scenario
- **Required For**: S18
- **Action**: Confirm if permission system exists
- **Fallback**: BLOCK scenario if not implemented

### BLOCKER 4: Undo System (RESOLVED - BLOCK)
- **Impact**: Affects 1 scenario
- **Required For**: S23
- **Action**: BLOCK scenario - conflicts with NFR-1 (irreversibility)
- **Resolution**: Do NOT implement S23

---

## Next Phase Requirements

Before proceeding to Phase 3, we MUST:

1. ✅ Identify agent creation strategy (use import method as fallback)
2. ⚠️ Investigate agent creation API (nice-to-have)
3. ⚠️ Investigate run/schedule APIs (or mark S15, S16 as BLOCKED)
4. ⚠️ Confirm permission system (or mark S18 as BLOCKED)
5. ❌ BLOCK S23 (undo) - conflicts with requirements

**Recommended Action**: Proceed with fallback strategy:
- Use `MonitorPage.importFromFile()` for agent creation
- BLOCK S15, S16, S18, S23 until clarification
- Focus on 20 executable scenarios

---

**End of Phase 2: State Dependency Analysis**

**Next**: Phase 3 - Executable Precondition Strategy

