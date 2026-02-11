# Phase 3: Executable Precondition Strategy - Delete Agent Feature

**Date**: February 8, 2026  
**Purpose**: Define HOW to establish required state for each scenario  
**Critical Rule**: Every required state MUST have an executable strategy

---

## Strategy Classification Key

| Symbol | Meaning | Example |
|--------|---------|---------|
| ✅ | Executable - Infrastructure exists | Use existing helper |
| 🔨 | Buildable - Need to implement | Create new Page Object method |
| ⚠️ | Risky - Uncertain feasibility | Depends on unknown API |
| ❌ | Blocked - Cannot implement | Missing system feature |

---

## Universal Precondition Strategies (ALL tests)

### Authentication & Navigation

| State | Strategy | Method | Code Pattern |
|-------|----------|--------|--------------|
| User exists | ✅ Existing fixture | `getTestUser()` | `const testUser = await getTestUser()` |
| User authenticated | ✅ Existing pattern | `LoginPage.login()` | See beforeEach pattern below |
| Monitor Tab loaded | ✅ Existing pattern | `page.goto() + isLoaded()` | `await page.goto("/monitoring")` |

**Standard beforeEach Template**:
```typescript
test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  const monitorPage = new MonitorPage(page);
  const testUser = await getTestUser();
  
  await page.goto("/login");
  await loginPage.login(testUser.email, testUser.password);
  await hasUrl(page, "/marketplace");
  
  await page.goto("/monitoring");
  await monitorPage.isLoaded();
});
```

---

## Agent Creation Strategies

### Discovery Summary
Found THREE viable methods for creating agents:

1. ✅ **BuildPage.createDummyAgent()** (FASTEST, PREFERRED)
   - Creates simple agent with dictionary block
   - Already implemented in infrastructure
   - Used during signup to create initial agent

2. ✅ **MonitorPage.importFromFile()** (RELIABLE, SLOWER)
   - Imports agent from JSON file
   - Requires fixture file in assets/
   - Already implemented

3. 🔨 **Navigate to Build + Manual Creation** (SLOWEST, AVOID)
   - Navigate to /build
   - Add blocks manually
   - Save agent
   - Too slow for many tests

**DECISION**: Use `BuildPage.createDummyAgent()` as primary strategy

---

## Agent Creation Helper (TO BE IMPLEMENTED)

### MonitorPage Extension Required

Add to `MonitorPage`:

```typescript
/**
 * Ensures at least one agent exists for testing
 * Creates a dummy agent if none exist
 * Returns list of agents
 */
async ensureAgentExists(name?: string): Promise<Agent> {
  const agents = await this.listAgents();
  
  if (agents.length > 0 && !name) {
    return agents[0]; // Return any existing agent
  }
  
  if (name) {
    const existing = agents.find(a => a.name === name);
    if (existing) return existing;
  }
  
  // Create new agent
  await this.navbar.clickBuildLink();
  const buildPage = new BuildPage(this.page);
  await buildPage.closeTutorial();
  await buildPage.createDummyAgent(); // Uses existing method!
  
  // Navigate back to monitor
  await this.page.goto("/monitoring");
  await this.isLoaded();
  
  // Verify creation
  const updatedAgents = await this.listAgents();
  const newAgent = updatedAgents.find(a => !agents.includes(a));
  
  if (!newAgent) throw new Error("Failed to create agent");
  return newAgent;
}

/**
 * Ensures exactly N agents exist
 */
async ensureExactAgentCount(count: number): Promise<Agent[]> {
  let agents = await this.listAgents();
  
  // Delete excess (NOTE: Requires deleteAgent to be implemented!)
  while (agents.length > count) {
    await this.deleteAgent(agents[0]);
    agents = await this.listAgents();
  }
  
  // Create missing
  while (agents.length < count) {
    await this.ensureAgentExists();
    agents = await this.listAgents();
  }
  
  return agents;
}

/**
 * Ensures zero agents exist (cleanup)
 */
async ensureZeroAgents(): Promise<void> {
  let agents = await this.listAgents();
  
  while (agents.length > 0) {
    await this.deleteAgent(agents[0]);
    agents = await this.listAgents();
  }
}
```

---

## Scenario-Specific Precondition Strategies

### Executable Scenarios (Phase 5 Ready)

| Scenario | State Requirements | Strategy | Implementation |
|----------|-------------------|----------|----------------|
| **S1** | 1+ agent | ✅ Use `ensureAgentExists()` | `await monitorPage.ensureAgentExists()` |
| **S2** | 1+ agent | ✅ Use `ensureAgentExists()` | `await monitorPage.ensureAgentExists()` |
| **S3** | 0 agents | ✅ Fresh user OR `ensureZeroAgents()` | `const testUser = await createTestUser()` |
| **S4** | Exactly 1 agent | ✅ Use `ensureExactAgentCount(1)` | `await monitorPage.ensureExactAgentCount(1)` |
| **S5** | 3+ agents | ✅ Use `ensureExactAgentCount(3)` | `await monitorPage.ensureExactAgentCount(3)` |
| **S6** | 1+ agent | ✅ Use `ensureAgentExists()` | `await monitorPage.ensureAgentExists()` |
| **S7** | 1+ agent | ✅ Use `ensureAgentExists()` | `await monitorPage.ensureAgentExists()` |
| **S9** | 1+ agent, track ID | ✅ Use `ensureAgentExists()` + store ID | `const agent = await monitorPage.ensureAgentExists(); const id = agent.id;` |
| **S10** | 1+ agent | ✅ Use `ensureAgentExists()` | `await monitorPage.ensureAgentExists()` |
| **S11** | 1+ agent | ✅ Use `ensureAgentExists()` | `await monitorPage.ensureAgentExists()` |
| **S12** | 1+ agent | ✅ Use `ensureAgentExists()` | `await monitorPage.ensureAgentExists()` |
| **S13** | 1+ agent | ✅ Use `ensureAgentExists()` | `await monitorPage.ensureAgentExists()` |
| **S19** | 1+ agent with name | ✅ Use `createDummyAgent()` with name | Create with specific name in Build page |
| **S20** | 2+ agents | ✅ Use `ensureExactAgentCount(2)` | `await monitorPage.ensureExactAgentCount(2)` |
| **S24** | 1+ agent | ✅ Use `ensureAgentExists()` | `await monitorPage.ensureAgentExists()` |

---

### Network Simulation Scenarios (Phase 5 Ready)

| Scenario | State Requirements | Strategy | Implementation |
|----------|-------------------|----------|----------------|
| **S8** | Network failure | ✅ Playwright route mock | `await page.route('**/api/agents/**', route => route.abort());` |
| **S21** | Network interruption | ✅ Playwright route mock | Same as S8 |
| **S22** | Slow network | ✅ Playwright route delay | `await page.route('**/api/agents/**', route => route.fulfill({ delay: 3000 }));` |

**Network Mock Example**:
```typescript
test("deletion handles network failure", async ({ page }) => {
  // ARRANGE
  const agent = await monitorPage.ensureAgentExists();
  
  // Mock network failure
  await page.route('**/api/agents/**', route => {
    if (route.request().method() === 'DELETE') {
      route.abort('failed');
    } else {
      route.continue();
    }
  });
  
  // ACT
  await monitorPage.deleteAgent(agent);
  
  // ASSERT
  // Should show error, agent still exists
});
```

---

### External API Scenarios (Phase 5 Ready)

| Scenario | State Requirements | Strategy | Implementation |
|----------|-------------------|----------|----------------|
| **S14** | Delete agent externally | ✅ Use `page.request.delete()` | See example below |
| **S17** | External change + UI refresh | ✅ Use `page.request.delete()` | Same as S14 |

**External API Delete Example**:
```typescript
test("handles stale state when agent deleted elsewhere", async ({ page }) => {
  // ARRANGE
  const agent = await monitorPage.ensureAgentExists();
  const agents = await monitorPage.listAgents();
  
  // Simulate external deletion via API
  await page.request.delete(`http://localhost:3000/api/agents/${agent.id}`);
  
  // ACT
  // User tries to delete already-deleted agent
  await monitorPage.clickAgent(agent.id);
  await monitorPage.clickTrashIcon(agent);
  await monitorPage.confirmDeletion();
  
  // ASSERT
  // Should handle gracefully (error message or refresh)
});
```

---

### RISKY Scenarios (Feasibility Uncertain)

| Scenario | Blocker | Strategy | Decision |
|----------|---------|----------|----------|
| **S15** | Need active run | ⚠️ Investigate run API OR skip | **RISKY - Tentatively BLOCK** |
| **S16** | Need schedules | ⚠️ Investigate schedule API OR skip | **RISKY - Tentatively BLOCK** |
| **S18** | Need read-only user | ⚠️ Investigate permission system OR skip | **RISKY - Tentatively BLOCK** |
| **S25** | Screen reader testing | ⚠️ Requires axe-core integration | **RISKY - Tentatively BLOCK** |

#### S15: Active Runs Strategy (IF API exists)
```typescript
// Hypothetical - needs investigation
const agent = await monitorPage.ensureAgentExists();
await page.request.post(`/api/agents/${agent.id}/run`, { data: {} });
// Then attempt delete
```

#### S16: Schedules Strategy (IF API exists)
```typescript
// Hypothetical - needs investigation
const agent = await monitorPage.ensureAgentExists();
await page.request.post(`/api/schedules`, {
  data: { agentId: agent.id, schedule: "0 0 * * *" }
});
// Then attempt delete
```

#### S18: Read-Only User Strategy (IF permission system exists)
```typescript
// Hypothetical
const readOnlyUser = await createTestUser();
await assignRole(readOnlyUser, 'read-only'); // Unknown if this exists
```

#### S25: Accessibility Strategy
```typescript
// Requires axe-core
import AxeBuilder from '@axe-core/playwright';
const results = await new AxeBuilder({ page }).analyze();
// Verify trash icon has proper ARIA labels
```

---

### BLOCKED Scenarios (Cannot Implement)

| Scenario | Reason | Decision |
|----------|--------|----------|
| **S23** | Undo system conflicts with NFR-1 | ❌ **BLOCKED - Do NOT implement** |

---

## Precondition Implementation Priority

### Phase 5A: Implement Core Helpers (FIRST)
1. 🔨 Extend `MonitorPage.deleteAgent()` - **CRITICAL BLOCKER**
2. 🔨 Add `MonitorPage.ensureAgentExists()` - **HIGH PRIORITY**
3. 🔨 Add `MonitorPage.ensureExactAgentCount()` - **MEDIUM PRIORITY**
4. 🔨 Add `MonitorPage.clickTrashIcon()` - **CRITICAL BLOCKER**
5. 🔨 Add `MonitorPage.confirmDeletion()` - **CRITICAL BLOCKER**
6. 🔨 Add `MonitorPage.cancelDeletion()` - **HIGH PRIORITY**
7. 🔨 Add `MonitorPage.hasDeleteConfirmationDialog()` - **MEDIUM PRIORITY**

### Phase 5B: Generate Test Files (AFTER 5A)
- Implement 15 executable scenarios
- Each test follows ARRANGE → ACT → ASSERT
- Use helpers created in Phase 5A

---

## Selector Discovery Requirements

Before implementing MonitorPage methods, we MUST discover:

| UI Element | Selector Type Needed | Discovery Method |
|------------|---------------------|------------------|
| Trash icon | data-testid OR role | 🔍 UI inspection needed |
| Confirmation dialog | data-testid OR role | 🔍 UI inspection needed |
| "Yes, delete" button | data-testid OR accessible name | 🔍 UI inspection needed |
| "Cancel" button | data-testid OR accessible name | 🔍 UI inspection needed |

**BLOCKER**: Cannot implement deleteAgent() without these selectors

**OPTIONS**:
1. Search codebase for React components
2. Run app and inspect elements
3. Ask user/developer for selectors

---

## Test Data Strategy

### Agent Names
Use deterministic, unique names per test:
```typescript
const agentName = `test-agent-delete-${Date.now()}`;
```

### Fixture Files (if using import method)
Create in `AutoGPT/tests/assets/`:
- `test-agent-minimal.json` - Minimal agent for fast import
- `test-agent-complex.json` - Agent with multiple blocks

---

## Cleanup Strategy

### Per-Test Cleanup
Not needed - each test uses isolated user from pool

### Suite Cleanup
Global cleanup in `test.afterAll()`:
```typescript
test.afterAll(async () => {
  // User pool persists for reuse
  // No cleanup needed
});
```

---

## State Strategy Summary Table

| State | Classification | Method | Risk |
|-------|---------------|--------|------|
| User authentication | ✅ Existing | `LoginPage.login()` | None |
| Monitor Tab loaded | ✅ Existing | `MonitorPage.isLoaded()` | None |
| 1+ agents exist | 🔨 Build | `ensureAgentExists()` | Low |
| Exact N agents | 🔨 Build | `ensureExactAgentCount()` | Low |
| 0 agents | ✅ Existing | Fresh user | None |
| Network mocking | ✅ Existing | `page.route()` | None |
| External API call | ✅ Existing | `page.request.delete()` | Low |
| Active runs | ⚠️ Risky | Unknown API | **HIGH** |
| Schedules | ⚠️ Risky | Unknown API | **HIGH** |
| Permissions | ⚠️ Risky | Unknown system | **HIGH** |
| Undo system | ❌ Blocked | Doesn't exist | N/A |
| Screen reader | ⚠️ Risky | Requires axe-core | Medium |

---

## Implementation Dependency Graph

```
┌─────────────────────────────────┐
│ Phase 5A: Core Implementation   │
└─────────────────────────────────┘
          │
          ├──► 1. Discover selectors (BLOCKING)
          │
          ├──► 2. Implement MonitorPage.deleteAgent()
          │    ├─► clickTrashIcon()
          │    ├─► confirmDeletion()
          │    └─► cancelDeletion()
          │
          ├──► 3. Implement MonitorPage.ensureAgentExists()
          │    └─► Uses BuildPage.createDummyAgent()
          │
          └──► 4. Implement MonitorPage.ensureExactAgentCount()
               └─► Uses deleteAgent() + ensureAgentExists()

┌─────────────────────────────────┐
│ Phase 5B: Test Generation       │
└─────────────────────────────────┘
          │
          ├──► Generate 15 executable tests
          │    ├─► S1, S2, S4-S14, S19-S22, S24
          │    └─► Each with ARRANGE → ACT → ASSERT
          │
          └──► Document 6 blocked/risky tests
               └─► S3 (conditional), S15, S16, S18, S23, S25
```

---

## Phase 3 Conclusion

### ✅ Executable Count: 15-20 scenarios

**HIGH CONFIDENCE (15)**:
S1, S2, S4-S14, S19-S22, S24

**CONDITIONAL (1)**:
S3 - if we can ensure zero agents

**BLOCKED (4)**:
S15, S16, S18, S23

**RISKY (1)**:
S25 - requires accessibility tools

### 🔨 Implementation Requirements

Before Phase 5B test generation:
1. ✅ Create agent creation helpers
2. ✅ Implement deletion methods
3. 🔍 **CRITICAL**: Discover UI selectors

### ⏭️ Ready for Phase 4: Feasibility Gate

Classify all 25 scenarios as:
- Executable (15+)
- Risky (2-3)
- Blocked (4-5)

---

**End of Phase 3: Executable Precondition Strategy**

**Next**: Phase 4 - Feasibility Gate

