import { test, expect } from "@playwright/test";
import {
  agentRow,
  ensureAgentPresent,
  gotoMonitor,
  login,
  openDeleteDialog,
  uniqueAgentName,
  waitForAgentRemoval,
  waitForAgentVisible,
} from "./delete-agent.helpers.js";

test.use({
  trace: "retain-on-failure",
  screenshot: "only-on-failure",
});

/**
 * Test Case ID: TC-002
 * Covered Requirements: FR-1, FR-2, FR-3, FR-4, FR-5, EC-1
 * Source Artifacts:
 *   - Flowchart Node: ShowDialog → UserDecision cancel
 *   - State(s)/Transition(s): S6→S7→S5
 *   - Sequence Step(s): ConfirmDialog cancel path
 *   - Gherkin Scenario (if applicable): S2
 * Test Type: Edge | Negative
 * Assumptions (if any): Cancel button available and preserves agent row.
 */
test("canceling delete leaves agent intact", async ({ page }) => {
  const agentName = uniqueAgentName("Delete Cancel");

  await login(page);
  await gotoMonitor(page);
  await ensureAgentPresent(page, agentName, "cancel path agent");

  const dialog = await openDeleteDialog(page, agentName);
  await dialog.getByRole("button", { name: /cancel|no|dismiss/i }).click();

  await waitForAgentVisible(page, agentName);
});

/**
 * Test Case ID: TC-013
 * Covered Requirements: FR-6, FR-7, NFR-3, SA-6
 * Source Artifacts:
 *   - Flowchart Node: ConfirmDelete, UpdateList
 *   - State(s)/Transition(s): S7→S8→S9
 *   - Sequence Step(s): ConfirmDialog confirm (double click) → single DELETE → remove
 *   - Gherkin Scenario (if applicable): S1 extended
 * Test Type: Negative | Edge
 * Assumptions (if any): Delete API matches **/agents/** and UI disables duplicate submissions.
 */
test("double-click on confirm does not trigger duplicate deletes", async ({ page }) => {
  const agentName = uniqueAgentName("Delete Double Click");

  await login(page);
  await gotoMonitor(page);
  await ensureAgentPresent(page, agentName, "double click guard");

  let deleteCalls = 0;
  await page.route("**/agents/**", async (route) => {
    if (route.request().method() !== "DELETE") {
      return route.continue();
    }

    deleteCalls += 1;
    await route.continue();
  });

  const dialog = await openDeleteDialog(page, agentName);
  const confirmButton = dialog.getByRole("button", { name: /yes,? delete/i });

  await confirmButton.click({ clickCount: 2, delay: 20 });
  await waitForAgentRemoval(page, agentName);

  expect(deleteCalls).toBe(1);
  await page.unroute("**/agents/**");
});

/**
 * Test Case ID: TC-010
 * Covered Requirements: FR-2, EC-2, EC-6
 * Source Artifacts:
 *   - Flowchart Node: CheckAgents decision
 *   - State(s)/Transition(s): S2→S3
 *   - Sequence Step(s): MonitorUI empty state render
 *   - Gherkin Scenario (if applicable): S3, S4
 * Test Type: Edge | State (FIXME)
 * Assumptions (if any): Requires isolated account with zero agents to validate empty state.
 */
test.fixme("shows empty state when no agents remain", async ({ page }) => {
  await login(page);
  await gotoMonitor(page);
  // Precondition: user must start with exactly one agent; controlled dataset required.
  const emptyBody = page.locator("tbody[data-testid='agent-flow-list-body']:empty");
  await expect(emptyBody).toBeVisible();
});

/**
 * Test Case ID: TC-011
 * Covered Requirements: EC-7, BR-4
 * Source Artifacts:
 *   - Flowchart Node: Nav guard
 *   - State(s)/Transition(s): S1 guard failure
 *   - Sequence Step(s): Access denied to Monitor tab
 *   - Gherkin Scenario (if applicable): N/A
 * Test Type: Security | Negative (FIXME)
 * Assumptions (if any): Needs user without delete permissions; not available in shared test pool.
 */
test.fixme("denies deletion when user lacks permission", async ({ page }) => {
  await login(page);
  await gotoMonitor(page);
});

/**
 * Test Case ID: TC-012
 * Covered Requirements: EC-3, FR-5, FR-6, NFR-2
 * Source Artifacts:
 *   - Flowchart Node: ShowDialog for active agent
 *   - State(s)/Transition(s): S6→S7 with active-running guard
 *   - Sequence Step(s): Attempt delete while agent running
 *   - Gherkin Scenario (if applicable): N/A
 * Test Type: Edge | State (FIXME)
 * Assumptions (if any): Requires ability to start an agent run and observe running status; pending clarification.
 */
test.fixme("handles deletion policy for active/running agent", async ({ page }) => {
  await login(page);
  await gotoMonitor(page);
});

/**
 * Test Case ID: TC-014
 * Covered Requirements: BR-3
 * Source Artifacts:
 *   - Flowchart Node: Nav (Monitor-only workflow)
 *   - State(s)/Transition(s): S1 guard to S2
 *   - Sequence Step(s): Absence of delete affordance outside Monitor tab
 *   - Gherkin Scenario (if applicable): N/A
 * Test Type: Security | Negative (FIXME)
 * Assumptions (if any): Needs UI confirmation that Library/Marketplace/Build lack delete controls; requires navigation helpers.
 */
test.fixme("delete controls are not exposed outside Monitor tab", async ({ page }) => {
  await login(page);
  await page.goto("/library");
  await expect(page.getByRole("button", { name: /delete/i })).toHaveCount(0);
});
