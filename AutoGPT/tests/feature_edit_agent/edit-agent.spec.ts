/**
 * Edit Agent Feature Tests
 *
 * EXPLORATION DATE: 2026-02-19
 * EMPIRICAL BASIS: All selectors, flows, and assertions derived from
 * live system exploration using playwright-cli.
 *
 * KEY EMPIRICAL FINDINGS (differ from requirements documentation):
 *
 * 1. DOCUMENTATION says: "Navigate to Monitor Tab" to initiate edit (FR-01)
 *    REALITY: Edit feature lives in the LIBRARY PAGE (/library), not Monitor Tab.
 *    Monitor Tab (/monitoring) agent click causes "Something went wrong" ERROR PAGE.
 *
 * 2. DOCUMENTATION says: "Pencil icon displayed next to selected agent" (FR-05, FR-06)
 *    REALITY: "Edit agent" is a MENU ITEM inside a "More actions" dropdown button on
 *    each agent card. There is no standalone pencil icon.
 *
 * 3. ALL three edit entry points open NEW BROWSER TABS (not same-tab navigation):
 *    - Library "More actions" → "Edit agent": new tab at /build?flowID=X&flowVersion=N
 *    - Agent detail page "Edit agent" button: new tab at /build?flowID=X&flowVersion=N
 *    - Library card "Open in builder" link: new tab at /build?flowID=X (no flowVersion)
 *
 * 4. Save in edit mode INCREMENTS flowVersion in the URL (1 → 2 → 3...).
 *    The flowID remains UNCHANGED.
 *
 * 5. Save dialog PRE-FILLS the agent's existing name (FR-07 empirically confirmed).
 *
 * SNAPSHOT EVIDENCE: Resources/references/exploration-evidence-edit-agent.md
 * SOURCE REPRESENTATION: representation/edit-agent-representation.md
 */

import test, { expect, BrowserContext, Page } from "@playwright/test";
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
 * Empirically verified pattern from delete-agent tests.
 */
async function createTestAgent(
  page: Page,
  name: string,
  description = "Agent for edit testing",
): Promise<string> {
  await page.goto("/build");
  await page.waitForLoadState("domcontentloaded");

  const buildPage = new BuildPage(page);
  await buildPage.closeTutorial();
  await buildPage.saveAgent(name, description);

  // Wait for URL to include flowID confirming the agent was persisted
  await page.waitForURL(/\/build\?flowID=/, { timeout: 15_000 });

  return name;
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

test.describe("Edit Agent Feature", () => {
  test.describe.configure({ mode: "serial" }); // Serial — agents created per test, state isolation needed

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

  // ─── TC-001: More Actions Menu Contains All Expected Options ───────────

  /**
   * Test Case ID: TC-001
   * Covered Requirements: FR-04, FR-05
   * Test Type: UI Validation / Menu Verification
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   *
   * Empirical basis: More actions dropdown confirmed to have "Edit agent",
   * "Duplicate agent", and "Delete agent" menu items.
   * Snapshot evidence: exploration-evidence-edit-agent.md (More Actions Dropdown)
   *
   * NOTE: FR-05 ("pencil icon") maps to the "Edit agent" menu item in the dropdown.
   *       The documentation describes the conceptual affordance; the implementation
   *       uses a "More actions" button + dropdown menu.
   */
  test("TC-001: More actions dropdown contains Edit, Duplicate, and Delete agent options", async ({
    page,
  }) => {
    // ARRANGE
    const agentName = `TC-EA-001-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const { getId } = getSelectors(page);
    const card = getId("library-agent-card").filter({ hasText: agentName });
    await expect(card.first()).toBeVisible();

    // ASSERT: "More actions" button is visible on the agent card (FR-04)
    const moreActionsBtn = card
      .first()
      .getByRole("button", { name: "More actions" });
    await expect(moreActionsBtn).toBeVisible();

    // ACT: Open the More actions dropdown
    await moreActionsBtn.click();

    // ASSERT: "Edit agent" menu item is visible (FR-05 — the edit affordance)
    await expect(
      page.getByRole("menuitem", { name: "Edit agent" }),
    ).toBeVisible();

    // ASSERT: "Duplicate agent" menu item is visible
    await expect(
      page.getByRole("menuitem", { name: "Duplicate agent" }),
    ).toBeVisible();

    // ASSERT: "Delete agent" menu item is visible
    await expect(
      page.getByRole("menuitem", { name: "Delete agent" }),
    ).toBeVisible();

    // Cleanup: close the dropdown
    await page.keyboard.press("Escape");

    // Cleanup: delete test agent
    await libraryPage.deleteAgent(agentName);
  });

  // ─── TC-002: Edit Agent Opens New Tab with Builder ─────────────────────

  /**
   * Test Case ID: TC-002
   * Covered Requirements: FR-04, FR-05, FR-06, FR-07
   * Test Type: Happy Path
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   *
   * Empirical basis:
   * - Clicking "Edit agent" menuitem generates: await page.getByRole('menuitem', { name: 'Edit agent' }).click()
   * - A NEW TAB opens at /build?flowID=<uuid>&flowVersion=<n>
   * - Tab title: "<AgentName> - Builder - AutoGPT Platform"
   * Snapshot evidence: exploration-evidence-edit-agent.md (After "Edit agent" Click)
   */
  test("TC-002: clicking Edit agent opens the builder in a new browser tab", async ({
    page,
    context,
  }) => {
    // ARRANGE
    const agentName = `TC-EA-002-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // Verify agent is in library (FR-04 precondition — agent is selectable)
    expect(await libraryPage.agentExists(agentName)).toBe(true);

    // ACT: Open More actions for the agent (FR-04, FR-05)
    await libraryPage.openAgentActions(agentName);

    // ASSERT: Edit agent menu item is visible before clicking (FR-05)
    expect(await libraryPage.isEditAgentMenuItemVisible()).toBe(true);

    // ACT: Click "Edit agent" and wait for new tab (FR-06)
    const newPagePromise = context.waitForEvent("page");
    await libraryPage.clickEditAgentMenuItem();
    const builderPage = await newPagePromise;

    // Wait for the builder to fully load — networkidle ensures API calls complete
    await builderPage.waitForLoadState("networkidle");

    // ASSERT: A new tab was opened (FR-06 — agent opens in editor)
    expect(context.pages().length).toBeGreaterThanOrEqual(2);

    // ASSERT: New tab URL matches builder pattern with flowID and flowVersion (FR-06)
    await expect(builderPage).toHaveURL(/\/build\?flowID=.+&flowVersion=\d+/);

    // ASSERT: Builder page title contains the agent name (FR-07 — agent loaded)
    // TIMING NOTE: Title is set AFTER networkidle via async JS. Use toHaveTitle() with
    // retry to wait until the agent name appears in the title.
    await expect(builderPage).toHaveTitle(new RegExp(agentName), { timeout: 15_000 });

    // ASSERT: Original library tab is still on library URL
    await expect(page).toHaveURL(/\/library/);

    // Cleanup
    await builderPage.close();
    await libraryPage.deleteAgent(agentName);
  });

  // ─── TC-003: Builder Save Dialog Pre-fills Existing Agent Name ─────────

  /**
   * Test Case ID: TC-003
   * Covered Requirements: FR-07
   * Test Type: UI Validation / State Verification
   * Preconditions Established: Agent created and opened in edit mode via TC-002 flow
   *
   * Empirical basis:
   * - After clicking save button in edit mode, the name input (data-testid="save-control-name-input")
   *   is pre-filled with the existing agent name.
   * - CONFIRMED: nameVal === "EditAgentExploration-Test" when agent was originally named that.
   * Snapshot evidence: exploration-evidence-edit-agent.md (Builder in Edit Mode - save dialog)
   */
  test("TC-003: save dialog in edit mode pre-fills the existing agent name", async ({
    page,
    context,
  }) => {
    // ARRANGE: Create agent with a unique, recognizable name
    const agentName = `TC-EA-003-Agent-${Date.now()}`;
    const agentDesc = "Description for TC-003";
    await createTestAgent(page, agentName, agentDesc);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ACT: Open agent in builder via Edit agent
    await libraryPage.openAgentActions(agentName);
    const newPagePromise = context.waitForEvent("page");
    await libraryPage.clickEditAgentMenuItem();
    const builderPage = await newPagePromise;

    // Wait for agent data to load — title update signals agent config is ready
    // TIMING NOTE: must wait for title to contain agent name before clicking save,
    // otherwise the name input will be empty (agent data not yet fetched from API).
    await expect(builderPage).toHaveTitle(new RegExp(agentName), { timeout: 15_000 });

    // ACT: Open save dialog in builder
    await builderPage.getByTestId("blocks-control-save-button").click();
    await builderPage
      .getByTestId("save-control-name-input")
      .waitFor({ state: "visible", timeout: 5_000 });

    // ASSERT: Name input is pre-filled with existing agent name (FR-07)
    const nameValue = await builderPage
      .getByTestId("save-control-name-input")
      .inputValue();
    expect(nameValue).toBe(agentName);

    // ASSERT: Save button for the dialog is visible
    await expect(
      builderPage.getByTestId("save-control-save-agent-button"),
    ).toBeVisible();

    // Cleanup: Cancel save dialog and close tab
    await builderPage.keyboard.press("Escape");
    await builderPage.close();
    await libraryPage.deleteAgent(agentName);
  });

  // ─── TC-004: Edit Agent → Modify Name → Save → Persists to Library ─────

  /**
   * Test Case ID: TC-004
   * Covered Requirements: FR-08, FR-09, FR-10, NFR-02
   * Test Type: Happy Path / End-to-End
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   *
   * Empirical basis:
   * - Modified name saved in builder → URL flowVersion increments (1 → 2) ✅
   * - After library page reload → updated name reflects in library cards ✅
   * - flowID unchanged after save — same agent, new version ✅
   * - NFR-02: changes to local instance only (no marketplace push) ✅
   * Snapshot evidence: exploration-evidence-edit-agent.md (After Name Modification)
   */
  test("TC-004: modifying agent name in edit mode and saving persists changes to library", async ({
    page,
    context,
  }) => {
    // ARRANGE
    const originalName = `TC-EA-004-Original-${Date.now()}`;
    const modifiedName = `TC-EA-004-Modified-${Date.now()}`;

    await createTestAgent(page, originalName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);
    expect(await libraryPage.agentExists(originalName)).toBe(true);

    // ACT: Open agent in builder
    await libraryPage.openAgentActions(originalName);
    const newPagePromise = context.waitForEvent("page");
    await libraryPage.clickEditAgentMenuItem();
    const builderPage = await newPagePromise;

    // Wait for agent data to load (title update = agent config is ready)
    await expect(builderPage).toHaveTitle(new RegExp(originalName), { timeout: 15_000 });

    // Capture the flowVersion before save
    const urlBefore = builderPage.url();
    const versionBefore = new URLSearchParams(
      new URL(urlBefore).search,
    ).get("flowVersion");

    // ACT: Open save dialog and modify agent name (FR-08)
    await builderPage.getByTestId("blocks-control-save-button").click();
    await builderPage
      .getByTestId("save-control-name-input")
      .waitFor({ state: "visible", timeout: 5_000 });
    await builderPage.getByTestId("save-control-name-input").fill(modifiedName);

    // ACT: Save the modification (FR-09)
    const urlBeforeSave_004 = builderPage.url();
    await builderPage.getByTestId("save-control-save-agent-button").click();

    // ASSERT: URL flowVersion is incremented (detect actual URL change, not just pattern match)
    await builderPage.waitForURL(
      (url) => url.href !== urlBeforeSave_004,
      { timeout: 15_000 },
    );
    const urlAfter = builderPage.url();
    const versionAfter = new URLSearchParams(
      new URL(urlAfter).search,
    ).get("flowVersion");
    const flowIdAfter = new URLSearchParams(new URL(urlAfter).search).get("flowID");
    const flowIdBefore = new URLSearchParams(new URL(urlBefore).search).get("flowID");

    // flowID must be unchanged (same agent, new version)
    expect(flowIdAfter).toBe(flowIdBefore);
    // flowVersion must have incremented
    expect(Number(versionAfter)).toBeGreaterThan(Number(versionBefore));

    // ACT: Go back to library and reload to check persistence (FR-10)
    await builderPage.close();
    await page.reload();
    await page.waitForLoadState("networkidle");

    // ASSERT: Modified name now appears in library (FR-10 — persisted to local instance)
    const { getId } = getSelectors(page);
    await expect(
      getId("library-agent-card").filter({ hasText: modifiedName }),
    ).toHaveCount(1);

    // ASSERT: Original name is gone (replaced by modified name)
    await expect(
      getId("library-agent-card").filter({ hasText: originalName }),
    ).toHaveCount(0);

    // Cleanup
    await libraryPage.deleteAgent(modifiedName);
  });

  // ─── TC-005: Edit Agent from Agent Detail Page ─────────────────────────

  /**
   * Test Case ID: TC-005
   * Covered Requirements: FR-06, FR-07
   * Test Type: Happy Path (alternative entry point)
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   *
   * Empirical basis:
   * - Agent detail page at /library/agents/<id>?activeTab=runs
   * - role="button" name="Edit agent" is visible (after waitForLoadState networkidle)
   * - Clicking it opens NEW TAB at /build?flowID=<uuid>&flowVersion=<n>
   * Snapshot evidence: exploration-evidence-edit-agent.md (Agent Detail Page)
   */
  test("TC-005: Edit agent button on detail page opens builder in new tab", async ({
    page,
    context,
  }) => {
    // ARRANGE: Create agent and get its ID from the See Runs URL
    const agentName = `TC-EA-005-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // Get agent ID via the See Runs link href
    const { getId } = getSelectors(page);
    const card = getId("library-agent-card").filter({ hasText: agentName });
    const seeRunsLink = getId("library-agent-card-see-runs-link", card.first());
    const seeRunsHref = await seeRunsLink.getAttribute("href");
    const agentIdMatch = seeRunsHref?.match(/\/library\/agents\/([^/]+)/);
    expect(agentIdMatch).not.toBeNull();
    const agentId = agentIdMatch![1];

    // ACT: Navigate to agent detail page
    await page.goto(`/library/agents/${agentId}`);
    await page.waitForLoadState("networkidle");

    // ASSERT: "Edit agent" button is visible on detail page (FR-05 / FR-06)
    const editAgentBtn = page.getByRole("button", { name: "Edit agent" });
    await expect(editAgentBtn).toBeVisible();

    // ACT: Click "Edit agent" and wait for new tab
    const newPagePromise = context.waitForEvent("page");
    await editAgentBtn.click();
    const builderPage = await newPagePromise;
    await builderPage.waitForLoadState("networkidle");

    // ASSERT: A new tab was opened with builder URL (FR-06)
    await expect(builderPage).toHaveURL(/\/build\?flowID=.+&flowVersion=\d+/);

    // NOTE: The flowID in the builder URL is a separate UUID from the library agent ID.
    // We verify the builder URL has a non-empty flowID (correct agent opens in builder).
    const builderFlowId = new URL(builderPage.url()).searchParams.get("flowID");
    expect(builderFlowId).toBeTruthy();

    // ASSERT: Builder page title includes the agent name (FR-07)
    // TIMING NOTE: Title loads after networkidle via async JS — use toHaveTitle with retry
    await expect(builderPage).toHaveTitle(new RegExp(agentName), { timeout: 15_000 });

    // Cleanup
    await builderPage.close();
    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);
    await libraryPage.deleteAgent(agentName);
  });

  // ─── TC-006: Library Navigation is the Actual Edit Entry Point ─────────

  /**
   * Test Case ID: TC-006
   * Covered Requirements: FR-01, FR-02, FR-03
   * Test Type: Navigation / Smoke
   *
   * NOTE on FR-01: Documentation states "Navigate to Monitor Tab" as the entry
   * point for editing agents. Empirically, the edit feature is on the LIBRARY
   * page, not the Monitor Tab. This test validates the actual working entry point.
   *
   * Snapshot evidence: exploration-evidence-edit-agent.md (Library Page)
   */
  test("TC-006: library page displays agent list and is the working edit feature entry point", async ({
    page,
  }) => {
    // ARRANGE: Ensure at least one agent exists
    const agentName = `TC-EA-006-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    // ACT: Navigate to library page
    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ASSERT: Library page loads with agent list (FR-02)
    await expect(page).toHaveURL(/\/library/);

    const { getId, getRole } = getSelectors(page);

    // ASSERT: Agent count badge is visible (FR-02 — list rendered)
    await expect(getId("agents-count")).toBeVisible();

    // ASSERT: Agent cards are present (FR-02, FR-03)
    await expect(getId("library-agent-card").first()).toBeVisible();

    // ASSERT: Created agent visible in list (FR-03 — includes user-created agents)
    await expect(
      getId("library-agent-card").filter({ hasText: agentName }),
    ).toHaveCount(1);

    // ASSERT: Each card has a "More actions" button (the edit entry mechanism)
    const card = getId("library-agent-card").filter({ hasText: agentName });
    await expect(
      card.first().getByRole("button", { name: "More actions" }),
    ).toBeVisible();

    // Cleanup
    await libraryPage.deleteAgent(agentName);
  });

  // ─── TC-007: Open in Builder Link Also Opens New Tab ──────────────────

  /**
   * Test Case ID: TC-007
   * Covered Requirements: FR-06 (supplementary path)
   * Test Type: Alternative Edit Path Verification
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   *
   * Empirical basis:
   * - "Open in builder" link is on each agent card (data-testid="library-agent-card-open-in-builder-link")
   * - href = "/build?flowID=<uuid>" (NO flowVersion param)
   * - Clicking opens NEW TAB (CORRECTION to previous infrastructure analysis)
   * Snapshot evidence: exploration-evidence-edit-agent.md (Open in Builder Link)
   */
  test("TC-007: Open in builder link on library card opens builder in a new tab without flowVersion", async ({
    page,
    context,
  }) => {
    // ARRANGE
    const agentName = `TC-EA-007-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const { getId } = getSelectors(page);
    const card = getId("library-agent-card").filter({ hasText: agentName });
    await expect(card.first()).toBeVisible();

    // ASSERT: "Open in builder" link is present on the card
    const openInBuilderLink = getId(
      "library-agent-card-open-in-builder-link",
      card.first(),
    );
    await expect(openInBuilderLink).toBeVisible();

    // ASSERT: href has flowID but NO flowVersion
    const href = await openInBuilderLink.getAttribute("href");
    expect(href).toMatch(/\/build\?flowID=[a-f0-9-]+$/); // ends with flowID, no &flowVersion

    // ACT: Click Open in builder — expect new tab
    const newPagePromise = context.waitForEvent("page");
    await openInBuilderLink.click();
    const builderPage = await newPagePromise;
    await builderPage.waitForLoadState("networkidle");

    // ASSERT: New tab opened (empirically confirmed all 3 paths open new tabs)
    expect(context.pages().length).toBeGreaterThanOrEqual(2);

    // ASSERT: New tab URL has flowID but no flowVersion param
    const builderUrl = builderPage.url();
    expect(builderUrl).toMatch(/\/build\?flowID=[a-f0-9-]+$/);

    // Cleanup
    await builderPage.close();
    await libraryPage.deleteAgent(agentName);
  });

  // ─── TC-008: Monitor Tab Agent Click Causes Error Page ─────────────────

  /**
   * Test Case ID: TC-008 (DOCUMENTS BROKEN FEATURE per requirements)
   * Covered Requirements: FR-01 (Monitor Tab path — BROKEN)
   * Test Type: Behavioral Documentation / Critical Finding
   *
   * CRITICAL FINDING: The requirements documentation specifies navigating to
   * the "Monitor Tab" and clicking an agent name as the edit mechanism (FR-01,
   * FR-04). Empirically, clicking an agent row in Monitor Tab (/monitoring)
   * causes an ERROR PAGE: "Something went wrong".
   *
   * This test documents the broken behavior and confirms that Monitor Tab
   * is NOT the correct edit entry point.
   *
   * Snapshot evidence: exploration-evidence-edit-agent.md (Monitor Tab section)
   */
  test("TC-008: [BROKEN] Monitor Tab agent click shows error page not edit workflow", async ({
    page,
  }) => {
    // ARRANGE: Ensure at least one agent exists to click on
    const agentName = `TC-EA-008-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    // ACT: Navigate to Monitor Tab
    await page.goto("/monitoring");
    await page.waitForLoadState("networkidle");

    // ASSERT: Monitor Tab loads and shows agent list
    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    // Wait for the agent row to appear in the table
    const agentRow = page.getByRole("row").filter({ hasText: agentName });
    await agentRow.waitFor({ state: "visible", timeout: 15_000 });

    // ACT: Click the agent name cell (as the documentation describes for FR-04)
    const agentCell = agentRow.getByRole("cell").filter({ hasText: agentName });
    await agentCell.click();

    // ASSERT: Error page is shown (CRITICAL BUG — clicking agent row = broken)
    await expect(page.getByText("Something went wrong")).toBeVisible({
      timeout: 10_000,
    });

    // Cleanup: Navigate away from error state
    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);
    await libraryPage.deleteAgent(agentName);
  });

  // ─── TC-009: Edit Action Maintains Same Agent (flowID Unchanged) ────────

  /**
   * Test Case ID: TC-009
   * Covered Requirements: FR-10, NFR-01, NFR-02
   * Test Type: State Transition / Identity Verification
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   *
   * Empirical basis:
   * - flowID is the same in the URL before and after saving in edit mode
   * - flowVersion increments on each save
   * - NFR-02: modifications saved to local instance only
   * Snapshot evidence: exploration-evidence-edit-agent.md (flowVersion increment)
   */
  test("TC-009: editing and saving an agent preserves its flowID and increments flowVersion", async ({
    page,
    context,
  }) => {
    // ARRANGE
    const agentName = `TC-EA-009-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ACT: Open agent in edit mode via More actions
    await libraryPage.openAgentActions(agentName);
    const newPagePromise = context.waitForEvent("page");
    await libraryPage.clickEditAgentMenuItem();
    const builderPage = await newPagePromise;

    // Wait for agent data to load before interacting with builder (agent name must appear in title)
    await expect(builderPage).toHaveTitle(new RegExp(agentName), { timeout: 15_000 });

    // Capture initial URL params
    const initialUrl = new URL(builderPage.url());
    const initialFlowId = initialUrl.searchParams.get("flowID");
    const initialVersion = Number(initialUrl.searchParams.get("flowVersion"));

    expect(initialFlowId).toBeTruthy();
    expect(initialVersion).toBeGreaterThan(0);

    // ACT: Save the agent (without modifying — to test that save still works)
    await builderPage.getByTestId("blocks-control-save-button").click();
    await builderPage
      .getByTestId("save-control-name-input")
      .waitFor({ state: "visible", timeout: 5_000 });

    // Modify description to trigger actual save (purely no-change save may not increment)
    await builderPage
      .getByTestId("save-control-description-input")
      .fill(`Updated description ${Date.now()}`);
    const urlBeforeSave_009 = builderPage.url();
    await builderPage.getByTestId("save-control-save-agent-button").click();

    // Wait for URL to update with new version (detect actual URL change)
    await builderPage.waitForURL(
      (url) => url.href !== urlBeforeSave_009,
      { timeout: 15_000 },
    );

    // Capture post-save URL params
    const afterUrl = new URL(builderPage.url());
    const afterFlowId = afterUrl.searchParams.get("flowID");
    const afterVersion = Number(afterUrl.searchParams.get("flowVersion"));

    // ASSERT: flowID is unchanged (same agent identity) (NFR-02 — local copy)
    expect(afterFlowId).toBe(initialFlowId);

    // ASSERT: flowVersion incremented (persistent version tracking) (FR-10)
    expect(afterVersion).toBeGreaterThan(initialVersion);

    // Cleanup
    await builderPage.close();
    await libraryPage.deleteAgent(agentName);
  });
});
