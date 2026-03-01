/**
 * Delete Agent Feature Tests
 *
 * EMPIRICAL BASIS: All selectors, flows, and assertions derived from
 * live system exploration on 2026-02-22 using playwright-cli.
 *
 * KEY EMPIRICAL FINDINGS (2026-02-22):
 * - Delete feature lives on the LIBRARY page (/library), NOT Monitor Tab (/monitoring)
 * - Accessed via "More actions" button → menuitem "Delete agent"
 * - Confirmation dialog: role="dialog" name="Delete agent"
 * - Dialog message: "Are you sure you want to delete this agent? This action cannot be undone."
 * - Confirm button: role="button" name="Delete Agent"   ← NOT "Yes, delete" (FR-7 discrepancy)
 * - Cancel button: role="button" name="Cancel"
 * - Close button: role="button" name="Close" (X in dialog header)
 * - Agent count badge: data-testid="agents-count"
 * - Agent card: data-testid="library-agent-card"
 * - Deletion is immediate — agent removed from DOM without page refresh
 *
 * DISCREPANCY FROM REPRESENTATION:
 * - Representation (FR-1, FR-2, FR-3, FR-4) describes Monitor Tab and trash icon on right.
 *   Actual implementation uses Library page with "More actions" → "Delete agent" flow.
 * - Representation (FR-7) says confirm button is "Yes, delete".
 *   Actual confirm button label is "Delete Agent".
 * - Representation (FR-6) says dialog message is "Are you sure you want to delete this agent?"
 *   Actual message adds: "This action cannot be undone."
 *
 * SNAPSHOT EVIDENCE:
 * - .playwright-cli/page-2026-02-22T21-33-13-560Z.yml — dialog visible with exact text
 * - .playwright-cli/page-2026-02-22T21-33-39-654Z.yml — agent absent after deletion
 *
 * SOURCE REPRESENTATION: representation/delete-agent-representation.md
 * EXPLORATION EVIDENCE: Resources/references/exploration-evidence-delete-agent.md
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
 * No blocks required — an empty agent is sufficient as a delete target.
 * Returns the agent name that was saved (used for library lookup).
 *
 * Empirically verified (2026-02-22):
 * - BuildPage.closeTutorial() dismisses role="button" name="Skip Tutorial"
 * - BuildPage.saveAgent() clicks data-testid="blocks-control-save-button",
 *   fills data-testid="save-control-name-input",
 *   clicks data-testid="save-control-save-agent-button"
 * - After save: URL becomes /build?flowID=<uuid>&flowVersion=1 confirming persistence
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

  await buildPage.saveAgent(name, description);

  // Wait for URL to include flowID confirming agent was persisted
  await page.waitForURL(/\/build\?flowID=/, { timeout: 15_000 });

  return name;
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

test.describe("Delete Agent Feature", () => {
  // Serial mode: these tests create and delete agents, state-dependent sequencing
  // prevents concurrent deletion races that could invalidate count assertions.
  test.describe.configure({ mode: "serial" });

  // 60s timeout: login + agent creation (BuildPage) + library navigation under load
  test.setTimeout(60_000);

  let libraryPage: LibraryPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const testUser = await getTestUser();

    libraryPage = new LibraryPage(page);

    // Suppress cookie consent banner (empirically required — banner blocks interaction)
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

  // ─── TC-DA-001: Happy Path — Full Deletion Flow ────────────────────────

  /**
   * Test Case ID: TC-DA-001
   * Covered Requirements: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, NFR-1, NFR-2, BR-1, BR-2, BR-3
   * Test Type: Happy Path
   * Preconditions: User authenticated (beforeEach), agent created via createTestAgent()
   * Empirical Basis: Full happy-path exploration 2026-02-22
   * Evidence Snapshots:
   *   - .playwright-cli/page-2026-02-22T21-33-13-560Z.yml (dialog visible)
   *   - .playwright-cli/page-2026-02-22T21-33-39-654Z.yml (agent removed)
   */
  test("TC-DA-001: successfully delete an agent — agent removed from library", async ({
    page,
  }) => {
    // ARRANGE: Create a unique test agent
    const agentName = `TC-DA-001-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    // Navigate to Library (empirically verified: delete feature is on Library page)
    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ASSERT PRE-STATE: Agent exists before deletion
    expect(await libraryPage.agentExists(agentName)).toBe(true);

    const { getId } = getSelectors(page);

    // ACT: Open More actions → click Delete agent menuitem
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();

    // ASSERT: Confirmation dialog is visible (FR-5)
    const dialog = page.getByRole("dialog", { name: "Delete agent" });
    await expect(dialog).toBeVisible();

    // ASSERT: Dialog contains exact empirically-verified message (FR-6 + NFR-2 implies "cannot be undone")
    // Note: Representation FR-6 says "Are you sure you want to delete this agent?"
    // Actual implementation adds: "This action cannot be undone." — verified 2026-02-22
    await expect(dialog).toContainText(
      "Are you sure you want to delete this agent? This action cannot be undone.",
    );

    // ASSERT: "Delete Agent" confirm button is present (FR-7 — actual label differs from repr "Yes, delete")
    const deleteBtn = page.getByRole("button", { name: "Delete Agent" });
    await expect(deleteBtn).toBeVisible();

    // ASSERT: Cancel option available — safety gate (BR-4)
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // ACT: Confirm deletion (FR-7, BR-2)
    await libraryPage.confirmDeleteAgent();

    // ASSERT: Agent no longer in library (FR-8, NFR-1 — immediate removal)
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(0, { timeout: 5_000 });
  });

  // ─── TC-DA-002: Cancel Path — Cancel Button ────────────────────────────

  /**
   * Test Case ID: TC-DA-002
   * Covered Requirements: FR-5, FR-6, FR-7, BR-4, EC-1
   * Test Type: Alternative Flow / Negative Path
   * Preconditions: User authenticated, agent exists
   * Empirical Basis: cancelDeleteAgent() method verified in LibraryPage (Feb 18, 2026)
   */
  test("TC-DA-002: cancel deletion via Cancel button — agent remains in library", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC-DA-002-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const countBefore = await libraryPage.getAgentCount();

    // ACT: Open delete dialog
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();

    const dialog = page.getByRole("dialog", { name: "Delete agent" });
    await expect(dialog).toBeVisible();

    // ACT: Cancel without confirming (AF-01 in UC-01)
    await libraryPage.cancelDeleteAgent();

    // ASSERT: Dialog is closed (AF-01-2)
    await expect(dialog).toBeHidden();

    // ASSERT: Agent still exists in library (BR-4, EC-1, POST-C1)
    const { getId } = getSelectors(page);
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(1);

    // ASSERT: Agent count unchanged (POST-C1)
    const countAfter = await libraryPage.getAgentCount();
    expect(countAfter).toBe(countBefore);
  });

  // ─── TC-DA-003: Cancel Path — X (Close) Button ────────────────────────

  /**
   * Test Case ID: TC-DA-003
   * Covered Requirements: FR-5, BR-4, EC-1
   * Test Type: Alternative Flow — dismiss variant
   * Preconditions: User authenticated, agent exists
   * Empirical Basis: dialog "Delete agent" has button "Close" (X) — verified 2026-02-22
   *   Snapshot: .playwright-cli/page-2026-02-22T21-33-13-560Z.yml line: button "Close" [ref=e530]
   */
  test("TC-DA-003: dismiss deletion dialog with X button — agent remains in library", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC-DA-003-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ACT: Open delete dialog → close with X
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();

    const dialog = page.getByRole("dialog", { name: "Delete agent" });
    await expect(dialog).toBeVisible();

    // ACT: Click the Close X button (AF-01-1: dismiss without confirming)
    await libraryPage.closeDeleteDialogWithX();

    // ASSERT: Dialog closed (AF-01-2)
    await expect(dialog).toBeHidden();

    // ASSERT: Agent still present (POST-C1)
    const { getId } = getSelectors(page);
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(1);
  });

  // ─── TC-DA-004: Dialog Content Verification ───────────────────────────

  /**
   * Test Case ID: TC-DA-004
   * Covered Requirements: FR-5, FR-6, FR-7, NFR-2, BR-2, BR-4
   * Test Type: UI Validation
   * Preconditions: User authenticated, agent exists
   * Empirical Basis: Snapshot .playwright-cli/page-2026-02-22T21-33-13-560Z.yml
   *   Verified exact dialog structure: heading, message, Cancel, Delete Agent, Close
   */
  test("TC-DA-004: delete confirmation dialog shows correct content and all safety controls", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC-DA-004-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ACT: Trigger delete dialog
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();

    const dialog = page.getByRole("dialog", { name: "Delete agent" });
    await expect(dialog).toBeVisible();

    // ASSERT: Dialog heading present (FR-5)
    await expect(
      dialog.getByRole("heading", { name: "Delete agent" }),
    ).toBeVisible();

    // ASSERT: Exact warning message (FR-6 + implied NFR-2)
    await expect(dialog).toContainText(
      "Are you sure you want to delete this agent? This action cannot be undone.",
    );

    // ASSERT: Confirm button "Delete Agent" visible (FR-7 — empirical label)
    await expect(
      page.getByRole("button", { name: "Delete Agent" }),
    ).toBeVisible();

    // ASSERT: Cancel button visible — safety gate (BR-4)
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // ASSERT: Close (X) button visible — can escape without deleting (BR-4)
    await expect(page.getByRole("button", { name: "Close" })).toBeVisible();

    // ASSERT: Agent NOT deleted while dialog is visible (BR-2 — confirmation gate)
    const { getId } = getSelectors(page);
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(1);

    // Cleanup: cancel to avoid leaving dangling test state
    await libraryPage.cancelDeleteAgent();
  });

  // ─── TC-DA-005: Delete Affordance — More Actions on Card ──────────────

  /**
   * Test Case ID: TC-DA-005
   * Covered Requirements: FR-3, FR-4, FR-5
   * Test Type: UI Validation / Visual Affordance
   * Preconditions: User authenticated, agent exists
   * Empirical Basis: snapshot showed button "More actions" [ref=e114] on each agent card
   *   clicking it reveals menu "More actions" with menuitem "Delete agent" [ref=e525]
   * Note: FR-4 (trash icon on right) maps to "More actions" button — the actual
   *   implementation uses a dropdown, not a standalone trash icon.
   */
  test("TC-DA-005: More actions button visible on agent card and contains Delete agent option", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC-DA-005-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const { getId } = getSelectors(page);
    const card = getId("library-agent-card").filter({ hasText: agentName });
    await expect(card.first()).toBeVisible();

    // ASSERT: "More actions" button is accessible on the card (FR-4 — delete affordance)
    const moreActionsBtn = card
      .first()
      .getByRole("button", { name: "More actions" });
    await expect(moreActionsBtn).toBeVisible();

    // ACT: Open actions menu
    await moreActionsBtn.click();

    // ASSERT: "Delete agent" option is visible in menu (FR-4, FR-5)
    await expect(
      page.getByRole("menuitem", { name: "Delete agent" }),
    ).toBeVisible();

    // Cleanup: close menu
    await page.keyboard.press("Escape");
  });

  // ─── TC-DA-006: Delete One of Multiple Agents ─────────────────────────

  /**
   * Test Case ID: TC-DA-006
   * Covered Requirements: FR-2, FR-3, FR-8, NFR-1, BR-3
   * Test Type: Happy Path — isolation check
   * Preconditions: User authenticated, 2 agents exist
   * Empirical Basis: Library snapshot shows multiple agent cards independently;
   *   deleteAgent() method flow confirmed isolated per-agent on 2026-02-22
   */
  test("TC-DA-006: delete one of multiple agents — only the targeted agent is removed", async ({
    page,
  }) => {
    // ARRANGE: Create two agents with unique names
    const agentToDelete = `TC-DA-006-Delete-${Date.now()}`;
    const agentToKeep = `TC-DA-006-Keep-${Date.now()}`;

    await createTestAgent(page, agentToDelete);
    await createTestAgent(page, agentToKeep);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const { getId } = getSelectors(page);

    // ASSERT PRE-STATE: Both agents visible (FR-2)
    await expect(
      getId("library-agent-card").filter({ hasText: agentToDelete }),
    ).toHaveCount(1);
    await expect(
      getId("library-agent-card").filter({ hasText: agentToKeep }),
    ).toHaveCount(1);

    const countBefore = await libraryPage.getAgentCount();

    // ACT: Delete only the first agent
    await libraryPage.deleteAgent(agentToDelete);

    // ASSERT: Deleted agent is gone (FR-8, NFR-1 — immediate)
    await expect(
      getId("library-agent-card").filter({ hasText: agentToDelete }),
    ).toHaveCount(0, { timeout: 5_000 });

    // ASSERT: The other agent is still present (BR-3 — only target deleted)
    await expect(
      getId("library-agent-card").filter({ hasText: agentToKeep }),
    ).toHaveCount(1);

    // ASSERT: Count decremented by exactly 1
    const countAfter = await libraryPage.getAgentCount();
    expect(countAfter).toBe(countBefore - 1);
  });

  // ─── TC-DA-007: Immediate UI Removal (No Page Refresh) ────────────────

  /**
   * Test Case ID: TC-DA-007
   * Covered Requirements: FR-8, NFR-1
   * Test Type: Immediate Removal Verification
   * Preconditions: User authenticated, agent exists
   * Empirical Basis: After clicking "Delete Agent" (2026-02-22), agent was absent from
   *   next snapshot without any page reload — URL stayed on /library
   * Timing Note: 5s timeout captures "immediate" behavior without masking real failures
   */
  test("TC-DA-007: agent removed from UI immediately after confirmation — no page refresh", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC-DA-007-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const { getId } = getSelectors(page);

    // ACT: Full delete flow
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();
    await libraryPage.confirmDeleteAgent();

    // ASSERT: Agent card disappears immediately (NFR-1 — immediate)
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(0, { timeout: 5_000 });

    // ASSERT: Remain on Library page — no full navigation occurred (FR-8 in-page removal)
    await expect(page).toHaveURL(/\/library/);
  });

  // ─── TC-DA-008: Agent Count Badge Decrements After Deletion ───────────

  /**
   * Test Case ID: TC-DA-008
   * Covered Requirements: FR-8, NFR-1
   * Test Type: State Verification — badge update
   * Preconditions: User authenticated, at least 1 agent exists
   * Empirical Basis: agents-count badge showed "15" before deletion;
   *   LibraryPage.getAgentCount() parses integer from data-testid="agents-count"
   */
  test("TC-DA-008: agents-count badge decrements immediately after deletion", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC-DA-008-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const countBefore = await libraryPage.getAgentCount();
    expect(countBefore).toBeGreaterThan(0);

    // ACT: Delete the agent
    await libraryPage.deleteAgent(agentName);

    // ASSERT: Count badge updated (NFR-1 — immediate update)
    const countAfter = await libraryPage.getAgentCount();
    expect(countAfter).toBe(countBefore - 1);
  });

  // ─── TC-DA-009: Library Navigation Smoke Test ─────────────────────────

  /**
   * Test Case ID: TC-DA-009
   * Covered Requirements: FR-1, FR-2, BR-1
   * Test Type: Navigation / Smoke
   * Preconditions: User authenticated
   * Empirical Basis: /library → auto-redirects to /library?sort=updatedAt,
   *   textbox "Search agents" visible, agents-count badge visible
   * Note: FR-1 (representation says "Monitor Tab") empirically resolved to Library page.
   */
  test("TC-DA-009: user navigates to Library page and sees the agent list interface", async ({
    page,
  }) => {
    // ACT: Navigate to library
    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ASSERT: Library loaded (FR-1 — entry point verified)
    await expect(page).toHaveURL(/\/library/);

    const { getId, getRole } = getSelectors(page);

    // ASSERT: Search interface present (FR-2 — can view/browse agent list)
    await expect(getRole("textbox", "Search agents")).toBeVisible();

    // ASSERT: Agent count badge present (FR-2 — reflects list size)
    await expect(getId("agents-count")).toBeVisible();
  });

  // ─── TC-DA-010: Safety Gate — No Delete Without Confirmation ──────────

  /**
   * Test Case ID: TC-DA-010
   * Covered Requirements: FR-5, FR-6, FR-7, NFR-2, BR-2
   * Test Type: Safety / Negative Path
   * Preconditions: User authenticated, agent exists
   * Empirical Basis: While dialog was visible, agent card was still present in 
   *   snapshot — deletion only occurs after "Delete Agent" button click
   * Note: Validates BR-2 — confirmation is the only mechanism that triggers deletion.
   *   Opening the dialog alone does NOT delete the agent.
   */
  test("TC-DA-010: agent is NOT deleted when dialog is shown but not confirmed", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC-DA-010-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const { getId } = getSelectors(page);

    // ACT: Open delete dialog
    await libraryPage.openAgentActions(agentName);
    await libraryPage.clickDeleteAgentMenuItem();

    const dialog = page.getByRole("dialog", { name: "Delete agent" });
    await expect(dialog).toBeVisible();

    // ASSERT: Agent still exists while dialog is open (BR-2 — dialog ≠ deletion)
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(1);

    // ACT: Cancel — do not confirm
    await libraryPage.cancelDeleteAgent();

    // ASSERT: Dialog closed; agent still present (POST-C1, EC-1)
    await expect(dialog).toBeHidden();
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(1);

    // Cleanup: re-navigate to library to clear any residual Radix inert/portal state,
    // then delete the agent. Without the re-navigation the <html> element may still have
    // the inert attribute set by Radix, causing "intercepts pointer events" errors.
    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);
    await libraryPage.deleteAgent(agentName);
  });
});
