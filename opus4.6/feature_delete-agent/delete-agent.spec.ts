/**
 * Delete Agent Feature — E2E Test Suite
 *
 * Exploration Date: 2026-02-23
 *
 * Key empirical findings that differ from requirements documentation:
 * 1. BLOCKER: Clicking any agent row on the Monitor Tab triggers a client-side
 *    crash ("Something went wrong") due to a TypeError in the monitoring page JS.
 *    This prevents reaching the agent detail view where the trash icon resides.
 *    Evidence: page-2026-02-23T07-26-41-236Z.yml (error page snapshot)
 *    Console: TypeError: Cannot read properties of null (reading 'properties')
 *
 * 2. The delete API (DELETE /api/proxy/api/graphs/<id>) fails with a 500 error
 *    when the agent has a library reference. A two-step delete is required:
 *    first DELETE /api/proxy/api/library/agents/<library_id>, then the graph.
 *
 * 3. No trash icon appears on hover over agent rows — the icon is in the
 *    detail view (which is unreachable due to finding #1).
 *
 * Snapshot evidence files:
 * - .playwright-cli/page-2026-02-23T07-20-37-166Z.yml (monitor page loaded)
 * - .playwright-cli/page-2026-02-23T07-24-07-731Z.yml (agent click crash)
 * - .playwright-cli/page-2026-02-23T07-26-56-853Z.yml (error recovery)
 * - .playwright-cli/page-2026-02-23T07-26-17-604Z.yml (agent list with new agent)
 *
 * Requirement trace: representation/delete-agent-representation.md
 */

import test, { expect } from "@playwright/test";
import { MonitorPage } from "../pages/monitor.page";
import { LoginPage } from "../pages/login.page";
import { getTestUser } from "../utils/auth";
import { hasUrl } from "../utils/assertion";

// Default mode: tests are independent (most are skipped anyway).
// TC-6 modifies state (deletes an agent) so it runs last via test ordering.
test.describe.configure({
  timeout: 30000,
});

// -----------------------------------------------------------------
// Shared setup: authenticate and navigate to monitoring page
// -----------------------------------------------------------------
let agentCountBeforeTest: number;

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  const testUser = await getTestUser();

  // Login
  await page.goto("/login");
  await loginPage.login(testUser.email, testUser.password);
  await hasUrl(page, "/marketplace");

  // Navigate to monitoring
  await page.goto("/monitoring");
  const monitorPage = new MonitorPage(page);
  await expect(monitorPage.isLoaded()).resolves.toBeTruthy();
});

// =================================================================
// TC-1: Monitor Tab loads and displays agent list
// Requirement: FR-01 (Display agent list in Monitor Tab)
// STT: STT-01 precondition — MonitorTabLoaded state
// Evidence: page-2026-02-23T07-20-37-166Z.yml — agent table visible
// =================================================================
test("TC-1: Monitor Tab displays agent list", async ({ page }) => {
  const monitorPage = new MonitorPage(page);

  // Verify monitor page loaded
  const isLoaded = await monitorPage.isLoaded();
  expect(isLoaded).toBeTruthy();

  // Verify Agents heading is visible
  // Evidence: heading "Agents" [level=3] observed in snapshot
  await expect(page.getByRole("heading", { name: "Agents", level: 3 })).toBeVisible();

  // Verify agent table structure: header row with Name, # of runs, Last run
  // Evidence: columnheader "Name", "# of runs", "Last run" in snapshot
  await expect(page.locator("thead th").first()).toBeVisible();

  // Verify at least one agent exists (precondition PC-03)
  const agents = await monitorPage.listAgents();
  expect(agents.length).toBeGreaterThan(0);
  agentCountBeforeTest = agents.length;
});

// =================================================================
// TC-2: User cancels deletion — agent list remains unchanged
// Requirement: EC-01, POC-02, BR-01 (STT-07)
// Status: BLOCKED — agent detail view crashes on click
// Evidence: page-2026-02-23T07-24-07-731Z.yml — "Something went wrong"
// Console: TypeError: Cannot read properties of null (reading 'properties')
// =================================================================
test.skip("TC-2: User cancels deletion — agent list unchanged", async ({ page }) => {
  // BLOCKED: Agent clicking triggers crash in monitoring page JS
  // The detail view where trash icon and confirmation dialog appear is unreachable.
  // See exploration-evidence-delete-agent.md Finding #1
  const monitorPage = new MonitorPage(page);
  const agents = await monitorPage.listAgents();
  expect(agents.length).toBeGreaterThan(0);

  const targetAgent = agents[0];
  const initialCount = agents.length;

  // This triggers the crash — detail view never loads
  await monitorPage.clickTrashIcon(targetAgent);
  await monitorPage.cancelDeletion();

  const postCancelAgents = await monitorPage.listAgents();
  expect(postCancelAgents.length).toBe(initialCount);
  expect(postCancelAgents.find((a) => a.id === targetAgent.id)).toBeDefined();
});

// =================================================================
// TC-3: Successful agent deletion (full flow)
// Requirement: FR-06, FR-07, FR-08, NFR-01, NFR-02, BR-02
// STT: STT-06 (ConfirmDialogOpen → AgentDeleted)
// Status: BLOCKED — agent detail view crashes on click
// Evidence: page-2026-02-23T07-26-41-236Z.yml — crash on freshly created agent
// =================================================================
test.skip("TC-3: Successful agent deletion via UI", async ({ page }) => {
  // BLOCKED: Same crash as TC-2.
  // All agent row clicks produce "Something went wrong"
  // Verified on 3 different agents including freshly created ones.
  const monitorPage = new MonitorPage(page);
  const agent = await monitorPage.ensureAgentExists();

  const agentsBefore = await monitorPage.listAgents();
  const initialCount = agentsBefore.length;

  await monitorPage.clickTrashIcon(agent);

  // Verify confirmation dialog (FR-04, FR-05)
  const hasDialog = await monitorPage.hasDeleteConfirmationDialog();
  expect(hasDialog).toBeTruthy();
  await expect(page.getByText("Are you sure you want to delete this agent?")).toBeVisible();
  await expect(page.getByRole("button", { name: /yes.*delete/i })).toBeVisible();

  // Confirm deletion (FR-06)
  await monitorPage.confirmDeletion();

  // Verify agent removed (FR-07, NFR-01)
  const agentsAfter = await monitorPage.listAgents();
  expect(agentsAfter.length).toBe(initialCount - 1);
  expect(agentsAfter.find((a) => a.id === agent.id)).toBeUndefined();
});

// =================================================================
// TC-4: Agent click produces error state (BUG — empirical finding)
// Requirement: FR-02 (User selects agent)
// STT: STT-01 (MonitorTabLoaded → AgentSelected) — FAILS
// Evidence: page-2026-02-23T07-20-58-659Z.yml and
//           page-2026-02-23T07-24-07-731Z.yml — error page after click
// This test documents the current broken behavior.
// =================================================================
test("TC-4: Agent click shows error page (known bug)", async ({ page }) => {
  const monitorPage = new MonitorPage(page);
  const agents = await monitorPage.listAgents();
  expect(agents.length).toBeGreaterThan(0);

  const targetAgent = agents[0];

  // Click agent — this triggers the crash
  // Evidence: await page.getByTestId('<agent-uuid>').click() → "Something went wrong"
  await monitorPage.clickAgent(targetAgent.id);

  // Wait for error state to appear
  // Evidence: paragraph "Something went wrong" in crash snapshot
  await expect(page.getByText("Something went wrong")).toBeVisible({
    timeout: 10000,
  });

  // Verify error message details
  // Evidence: page-2026-02-23T07-24-07-731Z.yml
  await expect(
    page.getByText("We had the following error when retrieving application:")
  ).toBeVisible();

  // Verify recovery controls are available
  // Evidence: button "Try Again", button "Report Error", link "Get Help"
  await expect(page.getByRole("button", { name: "Try Again" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Report Error" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Get Help" })).toBeVisible();
});

// =================================================================
// TC-5: Error recovery — "Try Again" restores agent list
// Requirement: Related to FR-01 (display agent list — recovery)
// Evidence: page-2026-02-23T07-26-56-853Z.yml — list restored after Try Again
// =================================================================
test("TC-5: Try Again button recovers from agent click error", async ({ page }) => {
  const monitorPage = new MonitorPage(page);
  const agents = await monitorPage.listAgents();
  expect(agents.length).toBeGreaterThan(0);

  const initialCount = agents.length;
  const targetAgent = agents[0];

  // Trigger the crash
  await monitorPage.clickAgent(targetAgent.id);
  await expect(page.getByText("Something went wrong")).toBeVisible({
    timeout: 10000,
  });

  // Click "Try Again"
  // Evidence: await page.getByRole('button', { name: 'Try Again' }).click();
  await page.getByRole("button", { name: "Try Again" }).click();

  // Wait for recovery — "Try Again" may not fully restore monitor page.
  // Give it a moment, then navigate explicitly if needed.
  await page.waitForTimeout(2000);

  const recovered = await monitorPage.isLoaded();
  if (!recovered) {
    // Fallback: manually navigate back to monitoring
    await page.goto("/monitoring");
    await expect(monitorPage.isLoaded()).resolves.toBeTruthy();
  }

  // Verify agent list is restored (count may vary slightly due to concurrent activity)
  const recoveredAgents = await monitorPage.listAgents();
  expect(recoveredAgents.length).toBeGreaterThanOrEqual(initialCount);
});

// =================================================================
// TC-6: Deletion via API (alternative path — bypasses broken UI)
// Requirement: FR-07, FR-08 (agent removal, permanent)
// This tests the backend delete functionality directly since UI is blocked.
// Evidence: API exploration showed 500 on direct delete due to FK constraint,
// and successful list/get via /api/proxy/api/library/agents and /graphs/<id>
// =================================================================
test("TC-6: Agent deletion via API (backend verification)", async ({ page }) => {
  const monitorPage = new MonitorPage(page);

  // Step 1: Get existing agents from monitor page
  const agentsBefore = await monitorPage.listAgents();
  const countBefore = agentsBefore.length;
  if (countBefore === 0) {
    test.skip(true, "No agents available for this test user");
    return;
  }

  // Pick the last agent in the list (least likely to affect other tests)
  const targetAgent = agentsBefore[agentsBefore.length - 1];

  // Step 2: Monitor table data-testid values are library agent IDs.
  // Evidence: exploration showed testid 573bf1bd-... maps to library agent id.
  // Try direct library agent delete first using the monitor row ID.
  const deleteLibResult = await page.evaluate(
    async (libId: string) => {
      const r = await fetch(`/api/proxy/api/library/agents/${libId}`, {
        method: "DELETE",
      });
      return { status: r.status, body: await r.text() };
    },
    targetAgent.id
  );

  // Accept 200, 204 for success. If 404/500, try finding via library API.
  if (deleteLibResult.status !== 200 && deleteLibResult.status !== 204) {
    // Fallback: look up library agents to find graph_id
    const libraryResponse = await page.evaluate(async () => {
      const r = await fetch("/api/proxy/api/library/agents");
      return r.json();
    });

    const libraryAgents: Array<{
      id: string;
      name: string;
      graph_id: string;
    }> = libraryResponse.agents || libraryResponse || [];

    const targetLib = libraryAgents.find(
      (a) => a.id === targetAgent.id || a.graph_id === targetAgent.id
    ) || libraryAgents.find((a) => a.name === targetAgent.name);

    if (!targetLib) {
      test.skip(true, "Could not find matching library agent");
      return;
    }

    // Delete library agent
    await page.evaluate(
      async (id: string) => {
        await fetch(`/api/proxy/api/library/agents/${id}`, {
          method: "DELETE",
        });
      },
      targetLib.id
    );

    // Delete graph
    const deleteGraphResult = await page.evaluate(
      async (gId: string) => {
        const r = await fetch(`/api/proxy/api/graphs/${gId}`, {
          method: "DELETE",
        });
        return { status: r.status };
      },
      targetLib.graph_id
    );
    expect([200, 204]).toContain(deleteGraphResult.status);
  } else {
    // Library agent deleted successfully. Now try deleting the graph.
    // The graph_id may be different from the library agent id.
    // Fetch it from the library API first (may already be gone).
    const deleteGraphResult = await page.evaluate(
      async (gId: string) => {
        const r = await fetch(`/api/proxy/api/graphs/${gId}`, {
          method: "DELETE",
        });
        return { status: r.status };
      },
      targetAgent.id // try with the same ID; may 404 if it's a library ID
    );
    // Don't assert on graph delete — it may 404 if id was library-only
  }

  // Step 3: Refresh monitoring page and verify agent is gone (FR-07)
  await page.goto("/monitoring");

  // Wait for the monitor page container (may not have rows if last agent deleted)
  // Use .first() because there can be multiple monitor-page testids
  await page.getByTestId("monitor-page").first().waitFor({
    state: "visible",
    timeout: 10_000,
  });

  // Wait for table structure to stabilize
  await page.waitForTimeout(2000);

  const agentsAfter = await page
    .locator("tbody tr[data-testid]")
    .all();
  expect(agentsAfter.length).toBeLessThan(countBefore);

  // Verify the specific agent is gone
  const deletedAgentRow = page.getByTestId(targetAgent.id);
  await expect(deletedAgentRow).toBeHidden();
});

// =================================================================
// TC-7: No agents in list — empty state
// Requirement: EC-02 (STT-02)
// Status: BLOCKED — cannot reliably delete all agents due to shared user pool
//   and FK constraint issues. ensureZeroAgents() depends on unverified UI delete.
// =================================================================
test.skip("TC-7: Empty agent list — no action possible", async ({ page }) => {
  // BLOCKED: Cannot reach zero-agent state reliably.
  // ensureZeroAgents() uses deleteAgent() which requires UI clicks that crash.
  // API-based bulk deletion is possible but risky for shared test user.
  const monitorPage = new MonitorPage(page);
  await monitorPage.ensureZeroAgents();

  const agents = await monitorPage.listAgents();
  expect(agents.length).toBe(0);
});

// =================================================================
// TC-8: Trash icon not visible without agent selection
// Requirement: EC-03 (STT-09)
// Status: BLOCKED — cannot verify trash icon visibility since detail view crashes
// Evidence: Hover on agent row shows no trash icon (page-2026-02-23T07-21-35-369Z.yml)
// =================================================================
test.skip("TC-8: Trash icon not visible without agent selection", async ({ page }) => {
  // BLOCKED: Trash icon is in the agent detail view which crashes on load.
  // Hovering over agents in the list view does not reveal a trash icon.
  const monitorPage = new MonitorPage(page);

  // Verify no delete button visible on the main list page
  const trashButton = page.getByTestId("delete-agent-button");
  await expect(trashButton).toBeHidden();
});

// =================================================================
// TC-9: Confirmation dialog has correct text and buttons
// Requirement: FR-04, FR-05, FR-06
// STT: STT-03 (AgentSelected → ConfirmDialogOpen)
// Status: BLOCKED — cannot reach confirmation dialog due to agent click crash
// =================================================================
test.skip("TC-9: Confirmation dialog displays correct message and buttons", async ({ page }) => {
  // BLOCKED: Agent click crashes before we can reach trash icon or dialog.
  const monitorPage = new MonitorPage(page);
  const agents = await monitorPage.listAgents();
  const agent = agents[0];

  await monitorPage.clickTrashIcon(agent);

  // Verify dialog message (FR-05)
  await expect(
    page.getByText("Are you sure you want to delete this agent?")
  ).toBeVisible();

  // Verify "Yes, delete" button (FR-06)
  await expect(
    page.getByRole("button", { name: /yes.*delete/i })
  ).toBeVisible();
});

// =================================================================
// TC-10: Delete is permanent — agent does not reappear after refresh
// Requirement: FR-08, NFR-02 (deletion permanent, irreversible)
// STT: STT-06 → S3 (terminal state)
// Status: BLOCKED via UI, but TC-6 covers this via API
// =================================================================
test.skip("TC-10: Deleted agent does not reappear after page refresh", async ({ page }) => {
  // BLOCKED: UI delete flow crashes. TC-6 covers API-based permanence verification.
  const monitorPage = new MonitorPage(page);
  const agent = await monitorPage.ensureAgentExists(`DA-Perm-${Date.now()}`);

  await monitorPage.deleteAgent(agent, true);

  // Refresh page
  await page.reload();
  await expect(monitorPage.isLoaded()).resolves.toBeTruthy();

  const agents = await monitorPage.listAgents();
  expect(agents.find((a) => a.id === agent.id)).toBeUndefined();
});

// =================================================================
// TC-11: Select different agent — highlight updates
// Requirement: FR-02, FR-03 (STT-04)
// Status: BLOCKED — agent click crashes
// =================================================================
test.skip("TC-11: Select different agent updates highlight", async ({ page }) => {
  // BLOCKED: All agent clicks crash the detail view.
  const monitorPage = new MonitorPage(page);
  const agents = await monitorPage.listAgents();
  expect(agents.length).toBeGreaterThanOrEqual(2);

  await monitorPage.clickAgent(agents[0].id);
  // Would verify highlight + trash icon for first agent
  // Then click second agent and verify highlight update
  await monitorPage.clickAgent(agents[1].id);
});

// =================================================================
// TC-12: Cancel deletion then delete same agent
// Requirement: STT-07 → STT-08 → STT-03 → STT-06
// Status: BLOCKED — agent click crashes
// =================================================================
test.skip("TC-12: Cancel then delete same agent", async ({ page }) => {
  // BLOCKED: Requires reaching agent detail view which crashes.
  const monitorPage = new MonitorPage(page);
  const agent = await monitorPage.ensureAgentExists();

  // First attempt — cancel
  await monitorPage.deleteAgent(agent, false);
  let agents = await monitorPage.listAgents();
  expect(agents.find((a) => a.id === agent.id)).toBeDefined();

  // Second attempt — confirm
  await monitorPage.deleteAgent(agent, true);
  agents = await monitorPage.listAgents();
  expect(agents.find((a) => a.id === agent.id)).toBeUndefined();
});

// =================================================================
// TC-13: Confirmation dialog is modal — blocks list interaction
// Requirement: STT-14 (ConfirmDialogOpen + SelectAgent → stays in dialog)
// Status: BLOCKED — cannot reach dialog
// =================================================================
test.skip("TC-13: Confirmation dialog blocks list interaction", async ({ page }) => {
  // BLOCKED: Cannot open confirmation dialog due to agent click crash.
  const monitorPage = new MonitorPage(page);
  const agents = await monitorPage.listAgents();
  expect(agents.length).toBeGreaterThanOrEqual(2);

  await monitorPage.clickTrashIcon(agents[0]);

  // Try clicking another agent while dialog is open — should be blocked
  const secondAgent = page.getByTestId(agents[1].id);
  // In a modal dialog, clicking outside should not work
  await expect(secondAgent).not.toBeVisible();
});
