/**
 * Edit Agent Feature Tests
 *
 * EMPIRICAL BASIS: All selectors, flows, and assertions derived from
 * live system exploration on 2026-02-18 using playwright-cli.
 *
 * KEY EMPIRICAL FINDINGS:
 * - Edit feature lives on the LIBRARY page (/library), NOT Monitor Tab (/monitoring)
 * - Monitor Tab (representation claims) navigates to a BROKEN ERROR PAGE when agent is clicked.
 * - "Edit agent" is accessed via "More actions" dropdown on library agent cards.
 * - "Edit agent" opens a NEW TAB with the builder at /build?flowID=<id>&flowVersion=<n>
 * - "Open in builder" direct link on card navigates to /build?flowID=<id> (SAME tab).
 * - "Edit agent" button ALSO exists on the agent detail page (/library/agents/<id>).
 * - The builder pre-fills the agent's existing name and description (FR-07).
 * - Saving increments flowVersion (e.g., version 1 → version 2).
 * - Saved changes persist immediately in the library listing.
 *
 * DISCREPANCY: Representation describes Monitor Tab and pencil icon → NOT found.
 * Tests are based on ACTUAL implementation, not documentation.
 *
 * SOURCE REPRESENTATION: representation/edit-agent-representation.md
 */

import test, { expect, Page } from "@playwright/test";
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
 * An empty agent is sufficient as an edit target.
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
  let libraryPage: LibraryPage;

  // These tests involve login + agent creation + multi-step navigation.
  // 60s ensures stability under parallel worker load without masking real slowness.
  test.setTimeout(60_000);

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const testUser = await getTestUser();

    libraryPage = new LibraryPage(page);

    // Auto-accept cookies
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

  // ─── TC-EA-001: Happy Path — More Actions → Edit agent opens builder ────

  /**
   * Test Case ID: TC-EA-001
   * Covered Requirements: FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07
   * Test Type: Happy Path
   * Source Artifacts: UC-01-S1 to UC-01-S3, Main Success Scenario
   * Assumptions: User authenticated, agent created via Build page
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   * State Location: LIBRARY page (empirically verified — NOT Monitor Tab)
   * Key Discovery: "Edit agent" menuitem in More actions opens NEW TAB at
   *   /build?flowID=<id>&flowVersion=<n>.
   *   Builder page title includes agent name — proves FR-07 (agent loaded with config).
   */
  test("TC-EA-001: open agent in builder via Library More Actions — Edit agent", async ({
    page,
    context,
  }) => {
    // ARRANGE: Create a test agent
    const agentName = `TC-EA-001-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    // Navigate to Library
    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);
    expect(await libraryPage.agentExists(agentName)).toBe(true);

    // ASSERT (precondition): Agent card shows "More actions" button (FR-04)
    const { getId, getRole } = getSelectors(page);
    const agentCard = getId("library-agent-card").filter({
      hasText: agentName,
    });
    const moreActionsBtn = getRole("button", "More actions", {
      within: agentCard.first(),
    });
    await expect(moreActionsBtn).toBeVisible();

    // ACT: Open More actions dropdown (FR-04)
    await libraryPage.openAgentActions(agentName);

    // ASSERT: "Edit agent" menu item is visible (FR-05 — the "pencil/edit icon" equivalent)
    expect(await libraryPage.isEditAgentMenuItemVisible()).toBe(true);

    // ASSERT: Other actions also visible alongside edit
    expect(await libraryPage.isDuplicateAgentMenuItemVisible()).toBe(true);

    // ACT: Click "Edit agent" — opens builder in new tab (FR-06)
    const newPagePromise = context.waitForEvent("page");
    await libraryPage.clickEditAgentMenuItem();
    const builderPage = await newPagePromise;

    // ASSERT: New browser tab opened and navigated to builder (FR-06)
    await builderPage.waitForLoadState("domcontentloaded");
    await expect(builderPage).toHaveURL(/\/build\?flowID=.+&flowVersion=\d+/);

    // ASSERT: Agent name appears in browser tab title (FR-07 — agent loaded with config)
    await expect(builderPage).toHaveTitle(new RegExp(agentName));

    await builderPage.close();
  });

  // ─── TC-EA-002: Builder pre-fills existing configuration (FR-07) ────────

  /**
   * Test Case ID: TC-EA-002
   * Covered Requirements: FR-07, FR-08
   * Test Type: Happy Path / State Verification
   * Source Artifacts: UC-01-S3, UC-01-S4
   * Assumptions: User authenticated, agent created with known name/description
   * Preconditions Established: Agent created via BuildPage.saveAgent() with specific values
   * Key Discovery: Save dialog pre-populates name and description from persisted data.
   */
  test("TC-EA-002: builder pre-fills existing agent name and description on edit", async ({
    page,
    context,
  }) => {
    // ARRANGE: Create test agent with specific description
    const agentName = `TC-EA-002-Agent-${Date.now()}`;
    const agentDesc = "TC-EA-002 specific description for verification";
    await createTestAgent(page, agentName, agentDesc);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ACT: Open Edit agent in new tab
    await libraryPage.openAgentActions(agentName);
    const newPagePromise = context.waitForEvent("page");
    await libraryPage.clickEditAgentMenuItem();
    const builderPage = await newPagePromise;

    await builderPage.waitForLoadState("domcontentloaded");
    await expect(builderPage).toHaveURL(/\/build\?flowID=.+&flowVersion=\d+/);

    // ACT: Open save dialog to inspect pre-filled values
    const { getId: getBuilderId } = getSelectors(builderPage);
    // Root cause fix: wait for React app to fully mount before clicking save.
    // domcontentloaded fires before React binds click handlers; waitFor ensures
    // the save button is interactive (not just present in DOM).
    await getBuilderId("blocks-control-save-button").waitFor({
      state: "visible",
      timeout: 15_000,
    });
    await getBuilderId("blocks-control-save-button").click();

    // ASSERT: Name field pre-filled with existing agent name (FR-07)
    // Wait for save dialog to fully render before asserting values
    const nameInput = getBuilderId("save-control-name-input");
    await nameInput.waitFor({ state: "visible", timeout: 10_000 });
    await expect(nameInput).toHaveValue(agentName);

    // ASSERT: Description field pre-filled with existing description (FR-07)
    const descInput = getBuilderId("save-control-description-input");
    await expect(descInput).toHaveValue(agentDesc);

    await builderPage.close();
  });

  // ─── TC-EA-003: Save modifications — changes persist in library ──────────

  /**
   * Test Case ID: TC-EA-003
   * Covered Requirements: FR-08, FR-09, FR-10, BR-02, NFR-02
   * Test Type: Happy Path / Persistence Verification
   * Source Artifacts: UC-01-S4, UC-01-S5
   * Assumptions: User authenticated, agent created; edit opens new tab
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   * Key Discovery:
   *   - Saving increments flowVersion (version 1 → 2, etc.).
   *   - Updated agent name appears in library after save.
   *   - Changes are local-only (BR-02, NFR-02), not pushed to marketplace.
   */
  test("TC-EA-003: save modifications in builder — updated name persists in library", async ({
    page,
    context,
  }) => {
    // ARRANGE: Create a test agent
    const originalName = `TC-EA-003-Original-${Date.now()}`;
    const modifiedName = `TC-EA-003-Modified-${Date.now()}`;
    await createTestAgent(page, originalName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);
    expect(await libraryPage.agentExists(originalName)).toBe(true);

    // ACT: Open agent in builder
    await libraryPage.openAgentActions(originalName);
    const newPagePromise = context.waitForEvent("page");
    await libraryPage.clickEditAgentMenuItem();
    const builderPage = await newPagePromise;

    await builderPage.waitForLoadState("domcontentloaded");
    const initialUrl = builderPage.url();
    const initialVersionMatch = initialUrl.match(/flowVersion=(\d+)/);
    const initialVersion = initialVersionMatch
      ? parseInt(initialVersionMatch[1])
      : 1;

    // ACT: Modify agent name (FR-08) and save (FR-09)
    const { getId: getBuilderId } = getSelectors(builderPage);
    // Root cause fix: wait for React app to fully mount before interacting.
    // domcontentloaded fires before React binds handlers; save dialog will only
    // open after the component is interactive — waitFor ensures that.
    await getBuilderId("blocks-control-save-button").waitFor({
      state: "visible",
      timeout: 15_000,
    });
    await getBuilderId("blocks-control-save-button").click();
    // Wait for save dialog to open before filling name
    await getBuilderId("save-control-name-input").waitFor({
      state: "visible",
      timeout: 10_000,
    });
    await getBuilderId("save-control-name-input").fill(modifiedName);
    await getBuilderId("save-control-save-agent-button").click();

    // ASSERT: URL flowVersion increments after save (internal versioning)
    await builderPage.waitForURL(/\/build\?flowID=.+&flowVersion=\d+/, {
      timeout: 15_000,
    });
    const savedUrl = builderPage.url();
    const savedVersionMatch = savedUrl.match(/flowVersion=(\d+)/);
    const savedVersion = savedVersionMatch
      ? parseInt(savedVersionMatch[1])
      : 0;
    expect(savedVersion).toBeGreaterThan(initialVersion);

    await builderPage.close();

    // ASSERT: Reload library and verify updated name is visible (FR-10)
    await page.reload();
    await libraryPage.isLoaded();
    expect(await libraryPage.agentExists(modifiedName)).toBe(true);

    // ASSERT: Original name no longer appears (confirming rename committed)
    const { getId } = getSelectors(page);
    await expect(
      getId("library-agent-card").filter({ hasText: originalName }),
    ).toHaveCount(0);
  });

  // ─── TC-EA-004: Direct "Open in builder" link on agent card ─────────────

  /**
   * Test Case ID: TC-EA-004
   * Covered Requirements: FR-06, FR-07, NFR-01
   * Test Type: Happy Path / Alternative Entry Point
   * Source Artifacts: FR-06, FR-07
   * Assumptions: User authenticated, agent exists in library
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   * Key Discovery: "Open in builder" is a direct link on every agent card
   *   (data-testid="library-agent-card-open-in-builder-link") with href
   *   /build?flowID=<uuid> (no flowVersion in URL for this entry point).
   */
  test("TC-EA-004: open agent via direct Open in builder link — navigates to builder", async ({
    page,
  }) => {
    // ARRANGE: Create a test agent
    const agentName = `TC-EA-004-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ASSERT: "Open in builder" link exists on the agent card (FR-06 alternative path)
    const openInBuilderHref =
      await libraryPage.getOpenInBuilderHref(agentName);
    expect(openInBuilderHref).toMatch(/\/build\?flowID=.+/);

    // ACT: Click "Open in builder" link
    await libraryPage.clickOpenInBuilderLink(agentName);

    // ASSERT: Builder loads with the agent (FR-06, FR-07)
    await page.waitForURL(/\/build\?flowID=/, { timeout: 15_000 });
    // Root cause fix: builder sets title async after React fetches agent data (~4s).
    // Default 5s toHaveTitle timeout is too short; 15s gives React enough time.
    await expect(page).toHaveTitle(new RegExp(agentName), { timeout: 15_000 });

    // ASSERT: Save button is available (confirms editing is possible in this mode)
    const { getId } = getSelectors(page);
    await expect(getId("blocks-control-save-button")).toBeVisible();
  });

  // ─── TC-EA-005: Edit agent from agent detail page ────────────────────────

  /**
   * Test Case ID: TC-EA-005
   * Covered Requirements: FR-04, FR-05, FR-06, FR-07
   * Test Type: Happy Path / Secondary Entry Point
   * Source Artifacts: UC-01-S2, UC-01-S3
   * Assumptions: User authenticated, agent exists
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   * Key Discovery: Agent detail page (/library/agents/<id>) has "Edit agent"
   *   button that opens builder in a NEW TAB at /build?flowID=<id>&flowVersion=<n>.
   *   The detail page also shows "Export agent to file" and "Delete agent" actions.
   */
  test("TC-EA-005: open agent in builder via agent detail page Edit agent button", async ({
    page,
    context,
  }) => {
    // ARRANGE: Create a test agent
    const agentName = `TC-EA-005-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ACT: Navigate to agent detail page by clicking the agent name
    const agents = await libraryPage.getAgents();
    const targetAgent = agents.find((a) => a.name === agentName);
    expect(targetAgent).toBeDefined();

    await page.goto(targetAgent!.seeRunsUrl);
    await page.waitForLoadState("domcontentloaded");

    // ASSERT: Detail page loaded with agent name visible in heading
    // Root cause fix: agent detail page title is always "AutoGPT Platform" —
    // the agent name is in a heading[level=4], never in the browser <title>.
    await expect(page.getByRole("heading", { name: agentName })).toBeVisible({
      timeout: 10_000,
    });

    // ASSERT: "Edit agent" button is present on detail page (FR-05 — edit access point)
    const { getRole } = getSelectors(page);
    const editBtn = getRole("button", "Edit agent");
    await expect(editBtn).toBeVisible();

    // ASSERT: Additional agent actions are also present
    await expect(getRole("button", "Export agent to file")).toBeVisible();
    await expect(getRole("button", "Delete agent")).toBeVisible();

    // ACT: Click "Edit agent" — opens builder in new tab (FR-06)
    const newPagePromise = context.waitForEvent("page");
    await editBtn.click();
    const builderPage = await newPagePromise;

    // ASSERT: Builder opens in new tab with agent loaded (FR-06, FR-07)
    await builderPage.waitForLoadState("domcontentloaded");
    await expect(builderPage).toHaveURL(/\/build\?flowID=.+&flowVersion=\d+/);
    // Title is set async by React after agent data is fetched — needs extended timeout
    await expect(builderPage).toHaveTitle(new RegExp(agentName), {
      timeout: 15_000,
    });

    await builderPage.close();
  });

  // ─── TC-EA-006: Empty library — edit workflow unavailable (AF-01) ────────

  /**
   * Test Case ID: TC-EA-006
   * Covered Requirements: FR-01, FR-02, PC-02 (violated), AF-01
   * Test Type: Negative Path / Alternative Flow
   * Source Artifacts: AF-01 (Agent list is empty)
   * State Construction: Use a fresh user with no agents OR verify zero-card state
   * Preconditions: Any authenticated user who has NO agents in library
   * NOTE: This test verifies that without agents, no edit interactions are possible.
   * Implementation: Creates zero agents (or relies on user having empty library),
   *   then directly asserts the absence of agent cards and More actions buttons.
   */
  test("TC-EA-006: empty library — no agent cards visible, edit workflow unavailable", async ({
    page,
  }) => {
    // ARRANGE: Navigate to library page
    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    const agentCount = await libraryPage.getAgentCount();

    // This test requires an empty library (AF-01 / PC-02 violated).
    // Skip gracefully when the shared user already has agents — common in CI with a
    // pre-used account. Run against a user with no agents to exercise empty-state assertions.
    test.skip(
      agentCount > 0,
      "TC-EA-006 requires an empty library (AF-01). " +
        "Current user has existing agents — skipping to avoid silent pass on wrong branch. " +
        "Run against a clean user to validate empty-state behavior.",
    );

    const { getId, getRole } = getSelectors(page);

    // ASSERT: No agent cards present (AF-01 state — PC-02 violated)
    await expect(getId("library-agent-card")).toHaveCount(0);

    // ASSERT: No "More actions" buttons exist (edit workflow entry point absent)
    await expect(getRole("button", "More actions")).toHaveCount(0);

    // ASSERT: Count badge correctly shows 0
    const countBadge = getId("agents-count");
    await expect(countBadge).toBeVisible();
    const countText = await countBadge.textContent();
    expect(countText).toMatch(/^0/);
  });

  // ─── TC-EA-007: More actions menu contains all three expected items ───────

  /**
   * Test Case ID: TC-EA-007
   * Covered Requirements: FR-04, FR-05, NFR-01
   * Test Type: Happy Path / UI Completeness
   * Source Artifacts: UC-01-S2
   * Assumptions: User authenticated, agent exists
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   * Key Discovery: More actions menu contains exactly: Edit agent, Duplicate agent, Delete agent.
   */
  test("TC-EA-007: More actions menu — contains Edit agent, Duplicate agent, Delete agent", async ({
    page,
  }) => {
    // ARRANGE: Create a test agent
    const agentName = `TC-EA-007-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // ACT: Open More actions dropdown
    await libraryPage.openAgentActions(agentName);

    // ASSERT: All three expected menu items are present
    const { getRole } = getSelectors(page);
    // "Edit agent" — the edit workflow entry (FR-05)
    await expect(getRole("menuitem", "Edit agent")).toBeVisible();

    // "Duplicate agent" — additional action (discovered during exploration)
    await expect(getRole("menuitem", "Duplicate agent")).toBeVisible();

    // "Delete agent" — covered by separate test suite, verified here for completeness
    await expect(getRole("menuitem", "Delete agent")).toBeVisible();

    // Dismiss dropdown
    await page.keyboard.press("Escape");
  });

  // ─── TC-EA-008: Edit builder URL contains flowID and flowVersion ─────────

  /**
   * Test Case ID: TC-EA-008
   * Covered Requirements: FR-06, FR-07, FR-10
   * Test Type: Happy Path / URL Structure Verification
   * Source Artifacts: UC-01-S3
   * Assumptions: User authenticated, agent created
   * Preconditions Established: Agent created via BuildPage.saveAgent()
   * Key Discovery:
   *   - "Edit agent" URL format: /build?flowID=<uuid>&flowVersion=<int>
   *   - "Open in builder" URL format: /build?flowID=<uuid>  (no flowVersion)
   *   Both URLs point to the same flowID (same agent).
   */
  test("TC-EA-008: Edit agent and Open in builder both reference same flowID", async ({
    page,
    context,
  }) => {
    // ARRANGE: Create a test agent
    const agentName = `TC-EA-008-Agent-${Date.now()}`;
    await createTestAgent(page, agentName);

    await page.goto("/library");
    expect(await libraryPage.isLoaded()).toBe(true);

    // Get the Open in builder href (direct link, no flowVersion)
    const openInBuilderHref =
      await libraryPage.getOpenInBuilderHref(agentName);
    const flowIdMatch = openInBuilderHref.match(/flowID=([^&]+)/);
    expect(flowIdMatch).not.toBeNull();
    const expectedFlowId = flowIdMatch![1];

    // ACT: Open "Edit agent" in new tab
    await libraryPage.openAgentActions(agentName);
    const newPagePromise = context.waitForEvent("page");
    await libraryPage.clickEditAgentMenuItem();
    const builderPage = await newPagePromise;

    await builderPage.waitForLoadState("domcontentloaded");

    // ASSERT: Edit agent URL includes the SAME flowID as the Open in builder link
    const editUrl = builderPage.url();
    expect(editUrl).toContain(`flowID=${expectedFlowId}`);

    // ASSERT: Edit agent URL also includes flowVersion (version-aware edit)
    expect(editUrl).toMatch(/flowVersion=\d+/);

    await builderPage.close();
  });
});
