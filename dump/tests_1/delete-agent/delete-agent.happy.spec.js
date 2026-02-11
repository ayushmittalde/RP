import { test, expect } from "@playwright/test";
import {
  agentRow,
  confirmDeletion,
  ensureAgentPresent,
  gotoMonitor,
  login,
  openDeleteDialog,
  reloadMonitor,
  uniqueAgentName,
  waitForAgentRemoval,
  waitForAgentVisible,
} from "./delete-agent.helpers.js";

test.use({
  trace: "retain-on-failure",
  screenshot: "only-on-failure",
});

/**
 * Test Case ID: TC-001
 * Covered Requirements: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, NFR-1, NFR-2, NFR-3, BR-1, BR-2, BR-3
 * Source Artifacts:
 *   - Flowchart Node: Nav, ViewList, SelectAgent, LocateTrash, ClickTrash, ShowDialog, ConfirmDelete, UpdateList
 *   - State(s)/Transition(s): S1→S2→S4→S5→S6→S7→S8→S9; S9→S4
 *   - Sequence Step(s): User→MonitorUI navigate/list → click trash → ConfirmDialog confirm → AgentService DELETE → MonitorUI remove
 *   - Gherkin Scenario (if applicable): S1
 * Test Type: Happy | State | Integration
 * Assumptions (if any): Test user can access Monitor tab and import agents via UI; fixture import succeeds.
 */
test("delete agent removes it immediately and persists after reload", async ({ page }) => {
  const agentName = uniqueAgentName("Delete Happy");

  await login(page);
  await gotoMonitor(page);
  await ensureAgentPresent(page, agentName, "happy path agent");

  await openDeleteDialog(page, agentName);
  await confirmDeletion(page);
  await waitForAgentRemoval(page, agentName);

  await reloadMonitor(page);
  await expect(agentRow(page, agentName)).toHaveCount(0);
});

/**
 * Test Case ID: TC-003
 * Covered Requirements: FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, NFR-3, BR-3
 * Source Artifacts:
 *   - Flowchart Node: ViewList, SelectAgent, LocateTrash, ClickTrash, ShowDialog, ConfirmDelete, UpdateList
 *   - State(s)/Transition(s): S2→S4→S5→S6→S7→S8→S9→S4
 *   - Sequence Step(s): MonitorUI list → delete selected → remove row; other rows remain
 *   - Gherkin Scenario (if applicable): S5
 * Test Type: Happy | Edge | Integration
 * Assumptions (if any): Multiple agents can coexist for same user; import supports unique names.
 */
test("deleting one agent does not remove others", async ({ page }) => {
  const targetAgent = uniqueAgentName("Delete Target");
  const survivorAgent = uniqueAgentName("Delete Survivor");

  await login(page);
  await gotoMonitor(page);
  await ensureAgentPresent(page, targetAgent, "delete target");
  await ensureAgentPresent(page, survivorAgent, "should remain");

  await openDeleteDialog(page, targetAgent);
  await confirmDeletion(page);
  await waitForAgentRemoval(page, targetAgent);

  // Survivor still present
  await waitForAgentVisible(page, survivorAgent);

  // Cleanup: remove survivor to avoid polluting later runs
  await openDeleteDialog(page, survivorAgent);
  await confirmDeletion(page);
  await waitForAgentRemoval(page, survivorAgent);
});

/**
 * Test Case ID: TC-006
 * Covered Requirements: FR-6, FR-7, NFR-3, BR-1
 * Source Artifacts:
 *   - Flowchart Node: ShowDialog, ConfirmDelete, UpdateList
 *   - State(s)/Transition(s): S7→S8→S9
 *   - Sequence Step(s): ConfirmDialog confirm → AgentService DELETE → MonitorUI remove
 *   - Gherkin Scenario (if applicable): S10
 * Test Type: Performance | Happy
 * Assumptions (if any): UI update threshold of 2000ms is acceptable for NFR-3.
 */
test("removes agent within performance budget after confirmation", async ({ page }) => {
  const agentName = uniqueAgentName("Delete Perf");

  await login(page);
  await gotoMonitor(page);
  await ensureAgentPresent(page, agentName, "performance path agent");

  await openDeleteDialog(page, agentName);

  const start = Date.now();
  await confirmDeletion(page);
  await waitForAgentRemoval(page, agentName);
  const durationMs = Date.now() - start;

  expect(durationMs).toBeLessThanOrEqual(2000);
});
