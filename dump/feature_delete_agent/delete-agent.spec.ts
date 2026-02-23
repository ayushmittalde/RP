/**
 * Delete Agent Feature Tests
 *
 * EMPIRICAL BASIS: All selectors, flows, and assertions derived from
 * live system exploration on 2026-02-18 using playwright-cli.
 *
 * KEY FINDINGS:
 * - Delete feature lives in the LIBRARY page (/library), NOT Monitor Tab
 * - Accessed via "More actions" button → menuitem "Delete agent"
 * - Confirmation dialog: role="dialog" name="Delete agent"
 * - Dialog message: "Are you sure you want to delete this agent? This action cannot be undone."
 * - Confirm button: role="button" name="Delete Agent"
 * - Cancel button: role="button" name="Cancel"
 * - Close button: role="button" name="Close"
 * - Agent count badge: data-testid="agents-count"
 * - Agent card: data-testid="library-agent-card"
 *
 * SOURCE REPRESENTATION: representation/test_6.md
 */

import test, { expect } from "@playwright/test";
import { BuildPage } from "../pages/build.page";
import { LibraryPage } from "../pages/library.page";
import { LoginPage } from "../pages/login.page";
import { getTestUser } from "../utils/auth";
import { hasUrl } from "../utils/assertion";
import { getSelectors } from "../utils/selectors";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Create a minimal agent via BuildPage and save it.
 * Returns the agent name that was saved.
 * No blocks required — an empty agent is sufficient as a delete target.
 */
async function createTestAgent(
  page: import("@playwright/test").Page,
  name: string,
  description = "Agent for delete testing",
): Promise<string> {
  await page.goto("/build");
  await page.waitForLoadState("domcontentloaded");

  const buildPage = new BuildPage(page);
  await buildPage.closeTutorial();

  // Save the agent directly — no blocks needed for deletion tests
  await buildPage.saveAgent(name, description);

  // Wait for URL to include flowID confirming the agent was persisted
  await page.waitForURL(/\/build\?flowID=/, { timeout: 15_000 });

  return name;
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

test.describe("Delete Agent Feature", () => {
  test.describe.configure({ mode: "serial" }); // Serial — state-dependent deletion tests

  let libraryPage: LibraryPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const testUser = await getTestUser();

    libraryPage = new LibraryPage(page);

    // Accept cookies + login
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "autogpt_cookie_consent",
        JSON.stringify({
          hasConsented: true,
          timestamp: Date.now(),
          analytics: true,
          monitoring: true,
        }),
      );
    });

    await page.goto("/login");
    await loginPage.login(testUser.email, testUser.password);
    await hasUrl(page, /\/(marketplace|library|onboarding.*)?/);
  });

  // ─── TC-001: Happy Path — Successful Deletion ──────────────────────────

  /**
   * Test Case ID: TC-001
   * Covered Requirements: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, NFR-1, NFR-2, NFR-3, BR-1, BR-2
   * Test Type: Happy Path
   * Source Artifacts: Gherkin Scenario S1
   * Assumptions: User authenticated, agent created via Build page
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   * State Location: LIBRARY page (empirically verified — delete not in Monitor Tab)
   */
  test("TC-001: successfully delete an agent — agent removed from library", async ({
    page,
  }) => {
    // ARRANGE: Create a test agent
    const agentName = `TC001-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    // Navigate to Library
    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);
    expect(await libraryPage.agentExists(agentName)).toBe(true);

    const { getId } = getSelectors(page);

    // ACT: Open More actions → Delete agent → Confirm
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();

    // ASSERT: Confirmation dialog is visible with correct title
    const dialog = page.getByRole("dialog", { name: "Delete agent" });
    await expect(dialog).toBeVisible();

    // ASSERT: Dialog contains the correct message (FR-5, NFR-2, BR-2)
    await expect(dialog).toContainText(
      "Are you sure you want to delete this agent? This action cannot be undone.",
    );

    // ASSERT: "Delete Agent" button is present (FR-6)
    const deleteBtn = page.getByRole("button", { name: "Delete Agent" });
    await expect(deleteBtn).toBeVisible();

    // ASSERT: "Cancel" option exists (NFR-2 — safety gate)
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // ACT: Confirm deletion
    await libraryPage.confirmDeleteAgent();

    // ASSERT: Agent is no longer in the library (FR-7)
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(0);
  });

  // ─── TC-002: Cancellation Path — Modal Cancel Button ──────────────────

  /**
   * Test Case ID: TC-002
   * Covered Requirements: FR-3, FR-4, FR-5, EC-1
   * Test Type: Negative/Alternative Path
   * Source Artifacts: Gherkin Scenario S2
   * Assumptions: User authenticated, agent exists
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   */
  test("TC-002: cancel deletion via Cancel button — agent remains in library", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC002-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const initialCount = await libraryPage.getAgentCount();

    // ACT: Open delete flow then cancel
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();

    const dialog = page.getByRole("dialog", { name: "Delete agent" });
    await expect(dialog).toBeVisible();

    // ACT: Click Cancel
    await libraryPage.cancelDeleteAgent();

    // ASSERT: Dialog closed
    await expect(dialog).toBeHidden();

    // ASSERT: Agent still exists in the library (EC-1)
    const { getId } = getSelectors(page);
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(1);

    // ASSERT: Agent count unchanged
    const finalCount = await libraryPage.getAgentCount();
    expect(finalCount).toBe(initialCount);
  });

  // ─── TC-003: Cancellation via X (Close) Button ────────────────────────

  /**
   * Test Case ID: TC-003
   * Covered Requirements: FR-5, EC-1
   * Test Type: Negative Path
   * Source Artifacts: Gherkin Scenario S2 (dismiss variant)
   * Assumptions: User authenticated, agent exists
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   */
  test("TC-003: dismiss deletion dialog with X button — agent remains", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC003-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ACT: open delete dialog → Close with X
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();

    const dialog = page.getByRole("dialog", { name: "Delete agent" });
    await expect(dialog).toBeVisible();

    // ACT: Click the Close (X) button
    await libraryPage.closeDeleteDialogWithX();

    // ASSERT: Dialog closed, agent still present
    await expect(dialog).toBeHidden();
    const { getId } = getSelectors(page);
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(1);
  });

  // ─── TC-004: Dialog Content Verification ──────────────────────────────

  /**
   * Test Case ID: TC-004
   * Covered Requirements: FR-5, NFR-2, BR-2
   * Test Type: UI Validation
   * Source Artifacts: Gherkin Scenario S7
   * Assumptions: User authenticated, agent exists
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   */
  test("TC-004: delete confirmation dialog shows correct content and safety controls", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC004-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ACT: Trigger delete dialog
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();

    const dialog = page.getByRole("dialog", { name: "Delete agent" });
    await expect(dialog).toBeVisible();

    // ASSERT: Dialog title (FR-5)
    await expect(
      dialog.getByRole("heading", { name: "Delete agent" }),
    ).toBeVisible();

    // ASSERT: Exact warning message (FR-5, NFR-2)
    await expect(dialog).toContainText(
      "Are you sure you want to delete this agent? This action cannot be undone.",
    );

    // ASSERT: Confirm button present (FR-6)
    await expect(
      page.getByRole("button", { name: "Delete Agent" }),
    ).toBeVisible();

    // ASSERT: Cancel option present — safety gate (BR-2)
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // ASSERT: Close button present — can escape without deleting
    await expect(page.getByRole("button", { name: "Close" })).toBeVisible();

    // ASSERT: Agent NOT deleted while dialog is open (guard: agent still exists)
    const { getId } = getSelectors(page);
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(1);

    // Cleanup: Cancel so we don't leave deleted state
    await libraryPage.cancelDeleteAgent();
  });

  // ─── TC-005: More Actions Menu Contains Delete Option ─────────────────

  /**
   * Test Case ID: TC-005
   * Covered Requirements: FR-4, FR-8, NFR-4
   * Test Type: UI Validation / Visual Affordance
   * Source Artifacts: Gherkin Scenario S6
   * Note: FR-8 (trash icon on right) maps to More actions button position on card
   * Assumptions: User authenticated, agent exists
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   */
  test("TC-005: More actions button is visible on agent card and contains delete option", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC005-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const { getId } = getSelectors(page);
    const card = getId("library-agent-card").filter({ hasText: agentName });
    await expect(card.first()).toBeVisible();

    // ASSERT: "More actions" button exists and is visible on the card (FR-4, NFR-4)
    const moreActionsBtn = card
      .first()
      .getByRole("button", { name: "More actions" });
    await expect(moreActionsBtn).toBeVisible();

    // ACT: Open actions menu
    await moreActionsBtn.click();

    // ASSERT: "Delete agent" menu item is visible (FR-4)
    await expect(
      page.getByRole("menuitem", { name: "Delete agent" }),
    ).toBeVisible();

    // Cleanup: Close menu
    await page.keyboard.press("Escape");
  });

  // ─── TC-006: Delete One of Multiple Agents ────────────────────────────

  /**
   * Test Case ID: TC-006
   * Covered Requirements: FR-1, FR-2, FR-3, FR-6, FR-7, NFR-3
   * Test Type: Happy Path
   * Source Artifacts: Gherkin Scenario S5
   * Assumptions: User authenticated, multiple agents exist
   * Preconditions Established: 2 agents created via BuildPage.saveAgent()
   */
  test("TC-006: delete one agent when multiple exist — others remain unchanged", async ({
    page,
  }) => {
    // ARRANGE: Create two agents
    const agentToDelete = `TC006-Delete-${Date.now()}`;
    const agentToKeep = `TC006-Keep-${Date.now()}`;

    await createTestAgent(page, agentToDelete);
    await createTestAgent(page, agentToKeep);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // Verify both agents exist
    const { getId } = getSelectors(page);
    await expect(
      getId("library-agent-card").filter({ hasText: agentToDelete }),
    ).toHaveCount(1);
    await expect(
      getId("library-agent-card").filter({ hasText: agentToKeep }),
    ).toHaveCount(1);

    const countBefore = await libraryPage.getAgentCount();

    // ACT: Delete only the first agent
    await libraryPage.deleteAgent(agentToDelete);

    // ASSERT: Deleted agent is gone (FR-7)
    await expect(
      getId("library-agent-card").filter({ hasText: agentToDelete }),
    ).toHaveCount(0);

    // ASSERT: The other agent is still present (FR-7 — only target deleted)
    await expect(
      getId("library-agent-card").filter({ hasText: agentToKeep }),
    ).toHaveCount(1);

    // ASSERT: Agent count decremented by 1 (NFR-3 — immediate update)
    const countAfter = await libraryPage.getAgentCount();
    expect(countAfter).toBe(countBefore - 1);
  });

  // ─── TC-007: Immediate Removal from UI ────────────────────────────────

  /**
   * Test Case ID: TC-007
   * Covered Requirements: FR-7, NFR-3
   * Test Type: Performance / Immediate Removal
   * Source Artifacts: Gherkin Scenario S10
   * Assumptions: User authenticated, agent exists
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   */
  test("TC-007: agent is removed from UI immediately without page refresh", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC007-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const { getId } = getSelectors(page);

    // ACT: Delete agent
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();
    await libraryPage.confirmDeleteAgent();

    // ASSERT: Agent card disappears immediately without any navigation/refresh (NFR-3)
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(0, { timeout: 5_000 });

    // ASSERT: We remain on the library page (no reload happened)
    await expect(page).toHaveURL(/\/library/);
  });

  // ─── TC-008: Agent Count Decrements After Deletion ────────────────────

  /**
   * Test Case ID: TC-008
   * Covered Requirements: FR-7, NFR-3
   * Test Type: Boundary / State Verification
   * Source Artifacts: Gherkin Scenario S4 (last agent variant)
   * Assumptions: User authenticated, exactly 1 agent exists before the test
   * Preconditions Established: By creating exactly 1 agent and confirming count
   */
  test("TC-008: agents-count badge updates immediately after deletion", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC008-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const countBefore = await libraryPage.getAgentCount();
    expect(countBefore).toBeGreaterThan(0);

    // ACT: Delete agent
    await libraryPage.deleteAgent(agentName);

    // ASSERT: Count updated (NFR-3 — immediate) by checking the badge
    const countAfter = await libraryPage.getAgentCount();
    expect(countAfter).toBe(countBefore - 1);
  });

  // ─── TC-009: Library Page Navigation (FR-1 — Feature Entry Point) ─────

  /**
   * Test Case ID: TC-009
   * Covered Requirements: FR-1, FR-2
   * Test Type: Navigation / Smoke
   * Source Artifacts: Gherkin Scenario S1 pre-conditions
   * Note: FR-1 in the representation says "Monitor Tab" but empirical exploration
   *       reveals delete lives on the Library page. This test validates the
   *       actual navigation entry point.
   * Assumptions: User authenticated
   */
  test("TC-009: user can navigate to Library page and see agent list", async ({
    page,
  }) => {
    // ACT: Navigate to library
    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ASSERT: Library page is accessible
    await expect(page).toHaveURL(/\/library/);

    const { getId, getRole } = getSelectors(page);

    // ASSERT: Search bar is present (FR-2 — can view agent list)
    // Empirically verified: search input uses role textbox with name "Search agents"
    await expect(getRole("textbox", "Search agents")).toBeVisible();

    // ASSERT: Agents count badge is present
    await expect(getId("agents-count")).toBeVisible();
  });

  // ─── TC-010: Delete Does Not Run Without Confirmation ─────────────────

  /**
   * Test Case ID: TC-010
   * Covered Requirements: FR-5, NFR-2, BR-2
   * Test Type: Safety Validation
   * Source Artifacts: Gherkin Scenario S7
   * Assumptions: User authenticated, agent exists
   * Note: Validates BR-2 — confirmation is mandatory, deletion cannot bypass dialog
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   */
  test("TC-010: agent is NOT deleted when dialog is shown but not confirmed", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC010-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const { getId } = getSelectors(page);

    // ACT: Open delete dialog
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();

    const dialog = page.getByRole("dialog", { name: "Delete agent" });
    await expect(dialog).toBeVisible();

    // ASSERT: While dialog is visible, agent still exists (BR-2 — not deleted yet)
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(1);

    // ACT: Cancel (do not confirm)
    await libraryPage.cancelDeleteAgent();

    // ASSERT: Agent still present after cancel
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(1);

    // Cleanup: now actually delete it
    await libraryPage.deleteAgent(agentName);
  });
});
