import { test, expect } from "@playwright/test";
import {
  agentRow,
  cancelWithEscape,
  ensureAgentPresent,
  gotoMonitor,
  login,
  openDeleteDialog,
  uniqueAgentName,
  waitForAgentVisible,
} from "./delete-agent.helpers.js";

test.use({
  trace: "retain-on-failure",
  screenshot: "only-on-failure",
});

async function pickDeleteButton(row) {
  const candidates = [
    row.getByTestId(/delete|trash/i),
    row.getByRole("button", { name: /delete|trash/i }),
    row.locator("button[aria-label*='Delete']"),
  ];
  for (const locator of candidates) {
    if (!locator) continue;
    if ((await locator.count()) > 0) {
      return locator.first();
    }
  }
  return row.getByRole("button").first();
}

/**
 * Test Case ID: TC-004
 * Covered Requirements: FR-4, FR-8, NFR-4
 * Source Artifacts:
 *   - Flowchart Node: LocateTrash
 *   - State(s)/Transition(s): S5→S6
 *   - Sequence Step(s): MonitorUI renders trash affordance
 *   - Gherkin Scenario (if applicable): S6
 * Test Type: UI | Edge
 * Assumptions (if any): Trash action is a button in each row with accessible name.
 */
test("trash icon is right-aligned and discoverable", async ({ page }) => {
  const agentName = uniqueAgentName("Delete Icon");

  await login(page);
  await gotoMonitor(page);
  const row = await ensureAgentPresent(page, agentName, "icon position");

  const deleteButton = await pickDeleteButton(row);
  await expect(deleteButton).toBeVisible({ timeout: 10000 });

  const rowBox = await row.boundingBox();
  const deleteBox = await deleteButton.boundingBox();
  expect(rowBox && deleteBox).toBeTruthy();

  if (rowBox && deleteBox) {
    // Ensure the delete control sits on the right half of the row
    expect(deleteBox.x).toBeGreaterThan(rowBox.x + rowBox.width * 0.6);
  }

  const ariaLabel = await deleteButton.getAttribute("aria-label");
  expect(ariaLabel?.toLowerCase()).toContain("delete");
});

/**
 * Test Case ID: TC-005
 * Covered Requirements: FR-5, FR-6, NFR-2, BR-2
 * Source Artifacts:
 *   - Flowchart Node: ShowDialog, ConfirmDelete
 *   - State(s)/Transition(s): S6→S7→S8
 *   - Sequence Step(s): ConfirmDialog display and primary action
 *   - Gherkin Scenario (if applicable): S7
 * Test Type: UI | Happy
 * Assumptions (if any): Dialog text matches approved copy “Are you sure you want to delete this agent?” with primary button labeled “Yes, delete”.
 */
test("confirmation dialog shows required warning and primary action text", async ({ page }) => {
  const agentName = uniqueAgentName("Delete Dialog");

  await login(page);
  await gotoMonitor(page);
  await ensureAgentPresent(page, agentName, "dialog text");

  const dialog = await openDeleteDialog(page, agentName);

  await expect(dialog.getByText(/are you sure you want to delete this agent\?/i)).toBeVisible();
  await expect(dialog.getByRole("button", { name: /yes,? delete/i })).toBeVisible();
  await expect(dialog.getByRole("button", { name: /cancel|no/i })).toBeVisible();
});

/**
 * Test Case ID: TC-008
 * Covered Requirements: FR-5, EC-1, NFR-4
 * Source Artifacts:
 *   - Flowchart Node: ShowDialog → UserDecision cancel
 *   - State(s)/Transition(s): S7→S5
 *   - Sequence Step(s): ConfirmDialog cancel path
 *   - Gherkin Scenario (if applicable): S2
 * Test Type: Edge | Accessibility
 * Assumptions (if any): Dialog supports Escape to cancel and leaves agent untouched.
 */
test("escape key cancels deletion and keeps agent visible", async ({ page }) => {
  const agentName = uniqueAgentName("Delete Cancel Esc");

  await login(page);
  await gotoMonitor(page);
  await ensureAgentPresent(page, agentName, "cancel path");

  await openDeleteDialog(page, agentName);
  await cancelWithEscape(page);
  await waitForAgentVisible(page, agentName);
});
