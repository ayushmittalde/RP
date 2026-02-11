import { test, expect } from "@playwright/test";
import {
  agentRow,
  ensureAgentPresent,
  gotoMonitor,
  login,
  openDeleteDialog,
  uniqueAgentName,
  waitForAgentRemoval,
} from "./delete-agent.helpers.js";

test.use({
  trace: "retain-on-failure",
  screenshot: "only-on-failure",
});

/**
 * Test Case ID: TC-007
 * Covered Requirements: FR-6, FR-7, EC-5, NFR-3
 * Source Artifacts:
 *   - Flowchart Node: ConfirmDelete, DeleteAgent, UpdateList
 *   - State(s)/Transition(s): S7→S8→S10 (failure) → S7→S8→S9 (retry success)
 *   - Sequence Step(s): ConfirmDialog confirm → AgentService DELETE (500) → retry DELETE 200 → MonitorUI remove
 *   - Gherkin Scenario (if applicable): S8
 * Test Type: Negative | State
 * Assumptions (if any): Delete API calls match pattern **/agents/** allowing interception; UI surfaces an error and allows retry.
 */
test("surface error on failed delete then succeed on retry", async ({ page }) => {
  const agentName = uniqueAgentName("Delete Retry");
  await login(page);
  await gotoMonitor(page);
  await ensureAgentPresent(page, agentName, "retry failure path");

  let deleteCalls = 0;
  await page.route("**/agents/**", async (route) => {
    if (route.request().method() !== "DELETE") {
      return route.continue();
    }

    deleteCalls += 1;
    if (deleteCalls === 1) {
      await route.fulfill({ status: 500, body: "{\"error\":\"fail\"}" });
    } else {
      await route.continue();
    }
  });

  const dialog = await openDeleteDialog(page, agentName);
  const confirmButton = dialog.getByRole("button", { name: /yes,? delete/i });
  await confirmButton.click();

  const errorToast = page.getByText(/error|failed|unable to delete/i);
  await expect(errorToast).toBeVisible({ timeout: 15000 });
  await expect(agentRow(page, agentName)).toBeVisible();

  // Retry after failure
  const retryDialog = await openDeleteDialog(page, agentName);
  await retryDialog.getByRole("button", { name: /yes,? delete/i }).click();
  await waitForAgentRemoval(page, agentName);
  expect(deleteCalls).toBeGreaterThanOrEqual(2);

  await page.unroute("**/agents/**");
});

/**
 * Test Case ID: TC-009
 * Covered Requirements: FR-2, FR-7, EC-4, SA-4
 * Source Artifacts:
 *   - Flowchart Node: ViewList → LocateTrash → ConfirmDelete → UpdateList (conflict)
 *   - State(s)/Transition(s): Parallel S7/S8 across sessions, second delete receives error/refresh
 *   - Sequence Step(s): Session A delete → Session B sees removal or conflict
 *   - Gherkin Scenario (if applicable): S5 (extended for concurrency)
 * Test Type: Edge | Concurrency | State
 * Assumptions (if any): Same credentials can sign in multiple contexts; backend returns 404/409 or removes row on refresh.
 */
test("concurrent delete attempts handle stale rows gracefully", async ({ browser }) => {
  const agentName = uniqueAgentName("Delete Concurrency");

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    await login(pageA);
    await gotoMonitor(pageA);
    await ensureAgentPresent(pageA, agentName, "concurrency target");

    await login(pageB);
    await gotoMonitor(pageB);
    await expect(agentRow(pageB, agentName)).toBeVisible({ timeout: 20000 });

    await openDeleteDialog(pageA, agentName);
    await pageA.getByRole("button", { name: /yes,? delete/i }).click();
    await waitForAgentRemoval(pageA, agentName);

    // Other session should no longer allow deletion of stale row
    await pageB.reload({ waitUntil: "networkidle" });
    await gotoMonitor(pageB);
    await expect(agentRow(pageB, agentName)).toHaveCount(0);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
