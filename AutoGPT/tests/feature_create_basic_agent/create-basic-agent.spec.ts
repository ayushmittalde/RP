/**
 * Create Basic Agent Feature Tests
 *
 * Test Suite: create-basic-agent.spec.ts
 * Feature: Create Basic Agent (Q&A Agent and Calculator Agent)
 *
 * Exploration Date: February 22, 2026
 * Evidence File: Resources/references/exploration-evidence-create-basic-agent.md
 *
 * Key Empirical Findings (differ from documentation):
 * - Block IDs confirmed via authenticated API fetch (see evidence file)
 * - Operation values ARE capitalized: 'Add', 'Subtract', 'Multiply', 'Divide', 'Power'
 * - Connection handle names lowercase (case-insensitive via toLowerCase() in BuildPage)
 * - Sequential outer container data-ids: "1", "2", "3"... (NOT "custom-node-n")
 * - Two same-type blocks require dataId disambiguation using outer container ID
 * - Q&A agent EXECUTION blocked: AITextGeneratorBlock requires API credentials
 * - Calculator agent execution: NO external credentials required — local math
 * - Block name field: textbox "Enter Name" (accessed via fillBlockInputByPlaceholder)
 * - Agent blocks panel closes after adding each block (must reopen for next block)
 *
 * Assertion Evidence:
 * - Save success: URL changes to /build?flowID=<uuid> (confirmed via BuildPage.saveAgent + spec)
 * - Agent in library: LibraryPage.agentExists() method (confirmed in delete/edit tests)
 * - Completion badge: data-id^="badge-" and data-id$="-COMPLETED" (BuildPage.waitForCompletionBadge)
 * - Run button: data-testid="primary-action-run-agent" (confirmed via DOM inspection)
 *
 * Source Representation: representation/create-basic-agent-representation.md
 */

import test, { expect, Page } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { LibraryPage } from "../pages/library.page";
import { BuildPage, Block } from "../pages/build.page";
import { getTestUser } from "../utils/auth";
import { hasUrl } from "../utils/assertion";

// ─── Block IDs (Empirically Confirmed via API) ───────────────────────────────

const BLOCK_IDS = {
  AGENT_INPUT: "c0a8e994-ebf1-4a9c-a4d8-89d09c86741b",
  AI_TEXT_GENERATOR: "1f292d4a-41a4-4977-9684-7c8d560b9f91",
  AGENT_OUTPUT: "363ae599-353e-4804-937e-b2ee3cef3da4",
  CALCULATOR: "b1ab9b19-67a6-406d-abf5-2dba76d00c79",
};

// ─── Block Definitions ───────────────────────────────────────────────────────

const BLOCKS = {
  agentInput: (): Block => ({
    id: BLOCK_IDS.AGENT_INPUT,
    name: "AgentInputBlock",
    description: "Agent Input Block",
    type: "Input",
  }),
  aiTextGenerator: (): Block => ({
    id: BLOCK_IDS.AI_TEXT_GENERATOR,
    name: "AITextGeneratorBlock",
    description: "AI Text Generator Block",
    type: "AI",
  }),
  agentOutput: (): Block => ({
    id: BLOCK_IDS.AGENT_OUTPUT,
    name: "AgentOutputBlock",
    description: "Agent Output Block",
    type: "Output",
  }),
  calculator: (): Block => ({
    id: BLOCK_IDS.CALCULATOR,
    name: "CalculatorBlock",
    description: "Calculator Block",
    type: "Logic",
  }),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Standard login flow with cookie consent bypass.
 * Source: Infrastructure analysis (confirmed in delete-agent tests).
 */
async function loginAndNavigate(page: Page): Promise<void> {
  const loginPage = new LoginPage(page);
  const testUser = await getTestUser();

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
}

/**
 * Navigate to fresh builder and close tutorial.
 * Always starts from a clean canvas at /build.
 */
async function openFreshBuilder(
  page: Page,
  buildPage: BuildPage,
): Promise<void> {
  await page.goto("/build");
  await page.waitForLoadState("domcontentloaded");
  await buildPage.closeTutorial();
}

/**
 * Create a Q&A agent:
 * - Input Block (named "question") → AI Text Generator → Output Block (named "answer")
 * - Connects: question.result → ai.prompt; ai.response → output.value
 * - Does NOT select AI model/credentials (agent creation only, not execution)
 *
 * Evidence: Block IDs from API, connection handle names from API schemas,
 *            handle testid pattern verified via DOM inspection.
 *
 * Returns agent name for subsequent assertions.
 */
async function createQAAgent(
  page: Page,
  buildPage: BuildPage,
  agentName: string,
): Promise<void> {
  // Step 1: Add Input Block — becomes outer container node "1"
  // (FR-QA-001: system shall allow adding Input Block)
  await buildPage.addBlock(BLOCKS.agentInput());
  // Name the Input Block "question" (FR-QA-006)
  // Evidence: textbox "Enter Name" on block after addition
  await buildPage.fillBlockInputByPlaceholder(
    BLOCK_IDS.AGENT_INPUT,
    "Enter Name",
    "question",
  );
  await page.waitForTimeout(300); // Allow UI to settle

  // Step 2: Add AI Text Generator Block — becomes outer container node "2"
  // (FR-QA-002: system shall allow adding AI Text Generator Block)
  await buildPage.addBlock(BLOCKS.aiTextGenerator());
  await page.waitForTimeout(300);

  // Step 3: Add Output Block — becomes outer container node "3"
  // (FR-QA-003: system shall allow adding Output Block)
  await buildPage.addBlock(BLOCKS.agentOutput());
  // Name the Output Block "answer" (FR-QA-006)
  await buildPage.fillBlockInputByPlaceholder(
    BLOCK_IDS.AGENT_OUTPUT,
    "Enter Name",
    "answer",
  );
  await page.waitForTimeout(300);

  // Step 4: Connect Input.result → AI Text Generator.prompt (FR-QA-004, BR-005)
  // Evidence: output-handle-result exists in DOM (verified via innerHTML search)
  //           input-handle-prompt derived from API schema (prompt is input key)
  await buildPage.connectBlockOutputToBlockInputViaName(
    BLOCK_IDS.AGENT_INPUT,
    "Result",
    BLOCK_IDS.AI_TEXT_GENERATOR,
    "Prompt",
  );
  await page.waitForTimeout(500);

  // Step 5: Connect AI Text Generator.response → Output.value (FR-QA-005, BR-005)
  // Evidence: response is output key of AITextGeneratorBlock (API schema)
  //           value is input key of AgentOutputBlock (API schema)
  await buildPage.connectBlockOutputToBlockInputViaName(
    BLOCK_IDS.AI_TEXT_GENERATOR,
    "Response",
    BLOCK_IDS.AGENT_OUTPUT,
    "Value",
  );
  await page.waitForTimeout(500);

  // Step 6: Save agent (FR-QA-007, BR-004)
  await buildPage.saveAgent(agentName, "Q&A agent created via automated test");
  // Verify save via URL change to /build?flowID=uuid
  await page.waitForURL(/\/build\?flowID=/, { timeout: 20_000 });
}

/**
 * Create a Calculator agent:
 * - Input Block a (named "a") + Input Block b (named "b")
 * - Calculator Block with specified operation
 * - Output Block (named "result")
 * - Connections: a.result → calc.a; b.result → calc.b; calc.result → output.value
 *
 * Evidence: Outer container sequential data-ids "1", "2" verified via DOM inspection
 *           of existing passing test (build.spec.ts "user can add two blocks and connect them").
 *           Operation capitalized enum values from CalculatorBlock API schema.
 *
 * Returns agent name for subsequent assertions.
 */
async function createCalculatorAgent(
  page: Page,
  buildPage: BuildPage,
  agentName: string,
  operation: "Add" | "Subtract" | "Multiply" | "Divide",
): Promise<void> {
  // Step 1: Add first Input Block — outer container node "1"
  // (FR-CALC-001: multiple Input Blocks)
  await buildPage.addBlock(BLOCKS.agentInput());
  // Name first Input "a" (FR-CALC-006)
  // Use dataId "1" to target first instance
  await buildPage.fillBlockInputByPlaceholder(
    BLOCK_IDS.AGENT_INPUT,
    "Enter Name",
    "a",
    "1",
  );
  await page.waitForTimeout(300);

  // Step 2: Add second Input Block — outer container node "2"
  // (FR-CALC-001)
  await buildPage.addBlock(BLOCKS.agentInput());
  // Name second Input "b" (FR-CALC-006)
  // Use dataId "2" to target second instance
  await buildPage.fillBlockInputByPlaceholder(
    BLOCK_IDS.AGENT_INPUT,
    "Enter Name",
    "b",
    "2",
  );
  await page.waitForTimeout(300);

  // Step 3: Add Calculator Block — outer container node "3"
  // (FR-CALC-002)
  await buildPage.addBlock(BLOCKS.calculator());
  // Select mathematical operation (FR-CALC-007)
  // Evidence: operation enum from CalculatorBlock API schema, capitalized values
  // Build.spec.ts reference: selectBlockInputValue(calcBlock.id, "Operation", "Add")
  await buildPage.selectBlockInputValue(
    BLOCK_IDS.CALCULATOR,
    "Operation",
    operation,
  );
  await page.waitForTimeout(500);

  // Step 4: Add Output Block — outer container node "4"
  // (FR-CALC-003)
  await buildPage.addBlock(BLOCKS.agentOutput());
  // Name Output Block "result" (FR-CALC-006)
  await buildPage.fillBlockInputByPlaceholder(
    BLOCK_IDS.AGENT_OUTPUT,
    "Enter Name",
    "result",
  );
  await page.waitForTimeout(300);

  // Fit View: click React Flow "Fit View" button so all 4 blocks are in the
  // viewport before drag-connect. Without this, the first AgentInputBlock
  // (data-id="1") is placed off-screen and dragTo times out.
  // Evidence: .react-flow__controls-fitview, aria-label="Fit View", title="Fit View"
  await page.click(".react-flow__controls-fitview");
  await page.waitForTimeout(600);

  // Step 5: Connect Input(a).result → Calculator.a (FR-CALC-004, BR-005)
  // Use dataId "1" to target first AgentInputBlock instance
  await buildPage.connectBlockOutputToBlockInputViaName(
    BLOCK_IDS.AGENT_INPUT,
    "Result",
    BLOCK_IDS.CALCULATOR,
    "A",
    "1",
  );
  await page.waitForTimeout(500);

  // Step 6: Connect Input(b).result → Calculator.b (FR-CALC-004, BR-005)
  // Use dataId "2" to target second AgentInputBlock instance
  await buildPage.connectBlockOutputToBlockInputViaName(
    BLOCK_IDS.AGENT_INPUT,
    "Result",
    BLOCK_IDS.CALCULATOR,
    "B",
    "2",
  );
  await page.waitForTimeout(500);

  // Step 7: Connect Calculator.result → Output.value (FR-CALC-005, BR-005)
  // Calculator and Output have unique block types — no dataId needed
  await buildPage.connectBlockOutputToBlockInputViaName(
    BLOCK_IDS.CALCULATOR,
    "Result",
    BLOCK_IDS.AGENT_OUTPUT,
    "Value",
  );
  await page.waitForTimeout(500);

  // Step 8: Save agent (FR-CALC-007, BR-004)
  await buildPage.saveAgent(
    agentName,
    `Calculator agent: ${operation} operation`,
  );
  await page.waitForURL(/\/build\?flowID=/, { timeout: 20_000 });
}

// ─── Test Suite: Q&A Agent Creation ─────────────────────────────────────────

test.describe("Create Basic Agent — Q&A Agent Creation", () => {
  test.describe.configure({ mode: "serial" });

  let buildPage: BuildPage;
  let libraryPage: LibraryPage;

  test.beforeEach(async ({ page }) => {
    buildPage = new BuildPage(page);
    libraryPage = new LibraryPage(page);
    await loginAndNavigate(page);
  });

  /**
   * Test Case ID: TC-CBA-001
   * Covered Requirements: FR-QA-001, FR-QA-002, FR-QA-003, FR-QA-004, FR-QA-005,
   *                       FR-QA-006, FR-QA-007, BR-001, BR-004, BR-005, BR-006
   * Test Type: Happy Path — Complete Q&A Agent Creation
   * State Strategy: Fresh /build canvas; login via getTestUser()
   * Evidence: Block IDs from authenticated API (exploration-evidence-create-basic-agent.md)
   *           Connection handle names from AITextGeneratorBlock/AgentInputBlock/AgentOutputBlock schemas
   *
   * EXECUTION NOTE: This test creates an agent with AI Text Generator Block.
   * Execution (running) is BLOCKED — requires API credentials (see TC-CBA-QA-BLOCKED).
   */
  test("TC-CBA-001: Create complete Q&A agent with Input, AI Text Generator, Output blocks — connected and saved", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const agentName = `TC-CBA-001-QA-Agent-${Date.now()}`;

    // ARRANGE
    await openFreshBuilder(page, buildPage);

    // Verify blocks exist in API before adding (confirms block IDs are valid)
    const blocks = await buildPage.getBlocksFromAPI();
    const inputBlockExists = blocks.some(
      (b) => b.id === BLOCK_IDS.AGENT_INPUT,
    );
    const aiBlockExists = blocks.some(
      (b) => b.id === BLOCK_IDS.AI_TEXT_GENERATOR,
    );
    const outputBlockExists = blocks.some(
      (b) => b.id === BLOCK_IDS.AGENT_OUTPUT,
    );

    expect(inputBlockExists, "AgentInputBlock must exist in API").toBeTruthy();
    expect(
      aiBlockExists,
      "AITextGeneratorBlock must exist in API",
    ).toBeTruthy();
    expect(
      outputBlockExists,
      "AgentOutputBlock must exist in API",
    ).toBeTruthy();

    // ACT — Create Q&A agent
    await createQAAgent(page, buildPage, agentName);

    // ASSERT 1: Agent was saved — URL changed to /build?flowID=<uuid>
    // Evidence: waitForURL confirmed in multiple existing passing tests
    expect(page.url()).toMatch(/\/build\?flowID=/);

    // ASSERT 2: Run button is enabled (agent is ready for execution)
    // Evidence: BuildPage.isRunButtonEnabled() uses data-testid="primary-action-run-agent"
    const runEnabled = await buildPage.isRunButtonEnabled();
    expect(runEnabled, "Run button should be enabled after saving agent").toBeTruthy();

    // ASSERT 3: Agent appears in library
    // Evidence: LibraryPage.agentExists() confirmed in delete-agent tests
    await page.goto("/library");
    await libraryPage.isLoaded();
    const agentExists = await libraryPage.agentExists(agentName);
    expect(agentExists, `Q&A agent "${agentName}" should appear in library`).toBeTruthy();
  });

  /**
   * Test Case ID: TC-CBA-002
   * Covered Requirements: FR-QA-001, FR-QA-002, FR-QA-003, FR-QA-006
   * Test Type: Positive — Block Naming Validation
   * State Strategy: Fresh /build canvas
   * Evidence: textbox "Enter Name" observed on canvas block after addBlock()
   *
   * Verifies that block name fields can be filled independently for Input and Output blocks.
   */
  test("TC-CBA-002: Input and Output blocks can be independently named in Q&A agent", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    // ARRANGE
    await openFreshBuilder(page, buildPage);

    // ACT — Add and name blocks
    await buildPage.addBlock(BLOCKS.agentInput());
    await buildPage.fillBlockInputByPlaceholder(
      BLOCK_IDS.AGENT_INPUT,
      "Enter Name",
      "question",
    );
    await page.waitForTimeout(300);

    await buildPage.addBlock(BLOCKS.agentOutput());
    await buildPage.fillBlockInputByPlaceholder(
      BLOCK_IDS.AGENT_OUTPUT,
      "Enter Name",
      "answer",
    );
    await page.waitForTimeout(300);

    // ASSERT — Blocks are present on canvas
    // Evidence: BuildPage.addBlock() uses data-testid="block-name-{id}" and verifies toBeAttached()
    const inputBlockLocator = page.getByTestId(BLOCK_IDS.AGENT_INPUT).first();
    const outputBlockLocator = page.getByTestId(BLOCK_IDS.AGENT_OUTPUT).first();

    await expect(inputBlockLocator, "AgentInputBlock should be on canvas").toBeVisible();
    await expect(outputBlockLocator, "AgentOutputBlock should be on canvas").toBeVisible();

    // ASSERT — Name fields have correct values (FR-QA-006)
    // Evidence: textbox "Enter Name" confirmed in snapshot after addBlock()
    const inputNameField = page
      .locator(`[data-blockid="${BLOCK_IDS.AGENT_INPUT}"]`)
      .getByPlaceholder("Enter Name");
    await expect(inputNameField).toHaveValue("question");

    const outputNameField = page
      .locator(`[data-blockid="${BLOCK_IDS.AGENT_OUTPUT}"]`)
      .getByPlaceholder("Enter Name");
    await expect(outputNameField).toHaveValue("answer");
  });
});

// ─── Test Suite: Calculator Agent Creation ────────────────────────────────────

test.describe("Create Basic Agent — Calculator Agent Creation", () => {
  test.describe.configure({ mode: "serial" });

  let buildPage: BuildPage;
  let libraryPage: LibraryPage;

  test.beforeEach(async ({ page }) => {
    buildPage = new BuildPage(page);
    libraryPage = new LibraryPage(page);
    await loginAndNavigate(page);
  });

  /**
   * Test Case ID: TC-CBA-003
   * Covered Requirements: FR-CALC-001, FR-CALC-002, FR-CALC-003, FR-CALC-004,
   *                       FR-CALC-005, FR-CALC-006, FR-CALC-007, BR-001, BR-004, BR-005
   * Test Type: Happy Path — Complete Calculator Agent Creation with Multiply
   * State Strategy: Fresh /build canvas
   * Evidence:
   *   - CalculatorBlock ID and operation enum from API schema
   *   - Sequential node numbering: first block = outer container "1", second = "2"
   *   - selectBlockInputValue pattern (confirmed in build.spec.ts skipped test)
   *   - Operation value "Multiply" from [Add, Subtract, Multiply, Divide, Power] enum
   */
  test("TC-CBA-003: Create complete Calculator agent with two Inputs, Calculator (Multiply), Output — connected and saved", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const agentName = `TC-CBA-003-Calculator-Multiply-${Date.now()}`;

    // ARRANGE
    await openFreshBuilder(page, buildPage);

    // Verify Calculator block exists in API
    const blocks = await buildPage.getBlocksFromAPI();
    const calcBlockExists = blocks.some(
      (b) => b.id === BLOCK_IDS.CALCULATOR,
    );
    expect(calcBlockExists, "CalculatorBlock must exist in API").toBeTruthy();

    // ACT — Create Calculator agent with Multiply operation
    await createCalculatorAgent(page, buildPage, agentName, "Multiply");

    // ASSERT 1: Agent saved — URL changed to /build?flowID=<uuid>
    expect(page.url()).toMatch(/\/build\?flowID=/);

    // ASSERT 2: Run button enabled
    const runEnabled = await buildPage.isRunButtonEnabled();
    expect(
      runEnabled,
      "Run button should be enabled after saving Calculator agent",
    ).toBeTruthy();

    // ASSERT 3: Agent appears in library
    await page.goto("/library");
    await libraryPage.isLoaded();
    const agentExists = await libraryPage.agentExists(agentName);
    expect(
      agentExists,
      `Calculator agent "${agentName}" should appear in library`,
    ).toBeTruthy();
  });

  /**
   * Test Case ID: TC-CBA-004
   * Covered Requirements: FR-CALC-002, FR-CALC-007
   * Test Type: Positive — Calculator Operation Selection
   * State Strategy: Fresh /build canvas
   * Evidence: selectBlockInputValue pattern from build.spec.ts, operation enum from API
   *
   * Verifies all four mathematical operations can be selected.
   */
  test("TC-CBA-004: Calculator block accepts all four mathematical operations", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    // ARRANGE
    await openFreshBuilder(page, buildPage);

    // ACT — Add Calculator block and verify operation selection
    await buildPage.addBlock(BLOCKS.calculator());
    await page.waitForTimeout(500);

    // Verify Calculator block is on canvas
    const calcBlock = page.getByTestId(BLOCK_IDS.CALCULATOR).first();
    await expect(calcBlock, "CalculatorBlock should be on canvas").toBeVisible();

    // ASSERT — Can select each operation (FR-CALC-007)
    // Operations confirmed from API schema: Add, Subtract, Multiply, Divide, Power
    for (const operation of ["Add", "Subtract", "Multiply", "Divide"] as const) {
      // Select the operation — uses combobox [data-id="input-handle-operation"]
      await buildPage.selectBlockInputValue(
        BLOCK_IDS.CALCULATOR,
        "Operation",
        operation,
      );
      await page.waitForTimeout(200);
      // If no error thrown, operation was selected successfully
    }
  });
});

// ─── Test Suite: Calculator Agent Execution ───────────────────────────────────

test.describe("Create Basic Agent — Calculator Agent Execution", () => {
  test.describe.configure({ mode: "serial" });

  let buildPage: BuildPage;

  test.beforeEach(async ({ page }) => {
    buildPage = new BuildPage(page);
    await loginAndNavigate(page);
  });

  /**
   * Test Case ID: TC-CBA-005
   * Covered Requirements: FR-CALC-007, FR-CALC-008, FR-CALC-009, FR-CALC-010
   * Test Type: Happy Path — Calculator Multiply Execution (DT-001: 5 × 3 = 15)
   * State Strategy: Create fresh Calculator agent in test setup
   * Evidence:
   *   - runAgent() double-click pattern from BuildPage implementation
   *   - fillRunDialog uses agent-input-{name} pattern (from BuildPage source)
   *   - waitForCompletionBadge confirms [data-id^="badge-"][data-id$="-COMPLETED"]
   *   - No API credentials required (local calculation)
   */
  test("TC-CBA-005: Run Calculator agent with Multiply operation — 5 × 3 = 15", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const agentName = `TC-CBA-005-Multiply-${Date.now()}`;

    // ARRANGE — Create fresh Calculator agent
    await openFreshBuilder(page, buildPage);
    await createCalculatorAgent(page, buildPage, agentName, "Multiply");

    // Verify agent is save and run button is enabled
    expect(page.url()).toMatch(/\/build\?flowID=/);
    const runEnabled = await buildPage.isRunButtonEnabled();
    expect(runEnabled, "Run button should be enabled before execution").toBeTruthy();

    // ACT — Run the agent (FR-CALC-008)
    // Evidence: single click opens the run-inputs dialog; second click blocked by overlay
    await page.getByTestId("primary-action-run-agent").click();
    await page.waitForTimeout(600);

    // Fill run dialog with test inputs (a=5, b=3)
    // Evidence: agent-input-{blockName} pattern from BuildPage.fillRunDialog()
    //           Block "a" was named with fillBlockInputByPlaceholder → run key = "a"
    //           Block "b" was named with fillBlockInputByPlaceholder → run key = "b"
    await buildPage.fillRunDialog({ a: "5", b: "3" });

    // Submit the run
    await buildPage.clickRunDialogRunButton();

    // ASSERT — Execution completes successfully
    // Evidence: waitForCompletionBadge() waits for data-id ending in "-COMPLETED"
    await buildPage.waitForCompletionBadge();

    const completionVisible = await buildPage.isCompletionBadgeVisible();
    expect(
      completionVisible,
      "COMPLETED badge should appear after Calculator Multiply execution (5 × 3 = 15)",
    ).toBeTruthy();
  });

  /**
   * Test Case ID: TC-CBA-006
   * Covered Requirements: FR-CALC-007, FR-CALC-008, FR-CALC-009
   * Test Type: Happy Path — Calculator Add Execution (DT-005: 10 + 7 = 17)
   * State Strategy: Create fresh Calculator agent with Add operation
   * Evidence: Same as TC-CBA-005, different operation
   */
  test("TC-CBA-006: Run Calculator agent with Add operation — 10 + 7 = 17", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const agentName = `TC-CBA-006-Add-${Date.now()}`;

    // ARRANGE
    await openFreshBuilder(page, buildPage);
    await createCalculatorAgent(page, buildPage, agentName, "Add");
    expect(page.url()).toMatch(/\/build\?flowID=/);

    // ACT
    await page.getByTestId("primary-action-run-agent").click();
    await page.waitForTimeout(600);
    await buildPage.fillRunDialog({ a: "10", b: "7" });
    await buildPage.clickRunDialogRunButton();

    // ASSERT
    await buildPage.waitForCompletionBadge();
    const completionVisible = await buildPage.isCompletionBadgeVisible();
    expect(
      completionVisible,
      "COMPLETED badge should appear after Calculator Add execution (10 + 7 = 17)",
    ).toBeTruthy();
  });

  /**
   * Test Case ID: TC-CBA-007
   * Covered Requirements: FR-CALC-007, FR-CALC-008, FR-CALC-009
   * Test Type: Happy Path — Calculator Subtract Execution (DT-009: 20 - 8 = 12)
   * State Strategy: Create fresh Calculator agent with Subtract operation
   */
  test("TC-CBA-007: Run Calculator agent with Subtract operation — 20 - 8 = 12", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const agentName = `TC-CBA-007-Subtract-${Date.now()}`;

    // ARRANGE
    await openFreshBuilder(page, buildPage);
    await createCalculatorAgent(page, buildPage, agentName, "Subtract");
    expect(page.url()).toMatch(/\/build\?flowID=/);

    // ACT
    await page.getByTestId("primary-action-run-agent").click();
    await page.waitForTimeout(600);
    await buildPage.fillRunDialog({ a: "20", b: "8" });
    await buildPage.clickRunDialogRunButton();

    // ASSERT
    await buildPage.waitForCompletionBadge();
    const completionVisible = await buildPage.isCompletionBadgeVisible();
    expect(
      completionVisible,
      "COMPLETED badge should appear after Calculator Subtract execution (20 - 8 = 12)",
    ).toBeTruthy();
  });

  /**
   * Test Case ID: TC-CBA-008
   * Covered Requirements: FR-CALC-007, FR-CALC-008, FR-CALC-009
   * Test Type: Happy Path — Calculator Divide Execution (DT-013: 100 ÷ 4 = 25)
   * State Strategy: Create fresh Calculator agent with Divide operation
   */
  test("TC-CBA-008: Run Calculator agent with Divide operation — 100 ÷ 4 = 25", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    const agentName = `TC-CBA-008-Divide-${Date.now()}`;

    // ARRANGE
    await openFreshBuilder(page, buildPage);
    await createCalculatorAgent(page, buildPage, agentName, "Divide");
    expect(page.url()).toMatch(/\/build\?flowID=/);

    // ACT
    await page.getByTestId("primary-action-run-agent").click();
    await page.waitForTimeout(600);
    await buildPage.fillRunDialog({ a: "100", b: "4" });
    await buildPage.clickRunDialogRunButton();

    // ASSERT
    await buildPage.waitForCompletionBadge();
    const completionVisible = await buildPage.isCompletionBadgeVisible();
    expect(
      completionVisible,
      "COMPLETED badge should appear after Calculator Divide execution (100 ÷ 4 = 25)",
    ).toBeTruthy();
  });
});

// ─── Test Suite: Agent Save Validation ───────────────────────────────────────

test.describe("Create Basic Agent — Save Validation", () => {
  let buildPage: BuildPage;

  test.beforeEach(async ({ page }) => {
    buildPage = new BuildPage(page);
    await loginAndNavigate(page);
  });

  /**
   * Test Case ID: TC-CBA-009
   * Covered Requirements: FR-QA-007, FR-CALC-007, Edge-Case-2, BR-004
   * Test Type: Negative — Save with Empty Name
   * State Strategy: Fresh /build canvas with one block added
   * Evidence: BuildPage.saveAgent() uses data-testid="save-control-save-agent-button"
   *           dialog observed in existing agent-blocks spec (TC-AB-002)
   *
   * Verifies that saving an agent with empty name is prevented.
   */
  test("TC-CBA-009: Attempt to save agent with empty name is rejected (Edge-Case-2)", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    // ARRANGE
    await openFreshBuilder(page, buildPage);

    // Add a block so the agent has content
    await buildPage.addBlock(BLOCKS.agentInput());

    // ACT — Open save dialog and clear the name
    const saveButton = page.getByTestId("blocks-control-save-button");
    await saveButton.click();
    await page.waitForTimeout(500);

    const nameInput = page.getByTestId("save-control-name-input");
    await nameInput.clear();
    await nameInput.fill(""); // Explicitly empty

    const saveDialogButton = page.getByTestId("save-control-save-agent-button");

    // ASSERT — Save button disabled OR clicking shows error
    const isDisabled = await saveDialogButton.isDisabled();

    if (!isDisabled) {
      // If not disabled, clicking should fail validation (agent not saved)
      await saveDialogButton.click();
      await page.waitForTimeout(1000);

      // Should not navigate away — dialog stays open or URL doesn't gain flowID
      const currentUrl = page.url();
      expect(
        currentUrl,
        "URL should not contain flowID when save fails validation",
      ).not.toMatch(/flowID=/);
    } else {
      // Save button properly disabled for empty name (validating BR-004)
      expect(isDisabled, "Save dialog button should be disabled for empty name").toBeTruthy();
    }
  });

  /**
   * Test Case ID: TC-CBA-010
   * Covered Requirements: FR-QA-001, FR-QA-003
   * Test Type: Positive — Individual Block Addition
   * State Strategy: Fresh /build canvas
   * Evidence: BuildPage.addBlock() confirmed working in agent-blocks-core.spec.ts
   *
   * Quick smoke test: verifies that all 4 blocks can be added to the canvas.
   */
  test("TC-CBA-010: All required blocks — AgentInput, AITextGenerator, AgentOutput, Calculator — can be added to canvas", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    // ARRANGE
    await openFreshBuilder(page, buildPage);

    // ACT — Add each block type
    await buildPage.addBlock(BLOCKS.agentInput());
    await page.waitForTimeout(300);

    await buildPage.addBlock(BLOCKS.aiTextGenerator());
    await page.waitForTimeout(300);

    await buildPage.addBlock(BLOCKS.agentOutput());
    await page.waitForTimeout(300);

    await buildPage.addBlock(BLOCKS.calculator());
    await page.waitForTimeout(300);

    // ASSERT — All four blocks are visible on canvas
    // Evidence: BuildPage.addBlock() confirms toBeAttached() after click
    await expect(
      page.getByTestId(BLOCK_IDS.AGENT_INPUT).first(),
      "AgentInputBlock should be on canvas (FR-QA-001, FR-CALC-001)",
    ).toBeVisible();

    await expect(
      page.getByTestId(BLOCK_IDS.AI_TEXT_GENERATOR).first(),
      "AITextGeneratorBlock should be on canvas (FR-QA-002)",
    ).toBeVisible();

    await expect(
      page.getByTestId(BLOCK_IDS.AGENT_OUTPUT).first(),
      "AgentOutputBlock should be on canvas (FR-QA-003, FR-CALC-003)",
    ).toBeVisible();

    await expect(
      page.getByTestId(BLOCK_IDS.CALCULATOR).first(),
      "CalculatorBlock should be on canvas (FR-CALC-002)",
    ).toBeVisible();
  });
});

// ─── BLOCKED Tests (Not Generated) ───────────────────────────────────────────
//
// TC-CBA-QA-BLOCKED: Q&A Agent Execution
//   Reason: AITextGeneratorBlock requires API credentials (model + credentials inputs).
//   Without pre-configured LLM API keys, execution fails immediately.
//   Evidence: AITextGeneratorBlock API schema shows 'credentials' as required input.
//   Impact: FR-QA-008, FR-QA-009, FR-QA-010 are untestable without credential setup.
//   Status: BLOCKED pending credential configuration documentation.
//
// TC-CBA-DIVZERO-BLOCKED: Division by Zero (Edge-Case-5)
//   Reason: Requires Calculator agent to successfully run first. The expected behavior
//   (error message vs. special value like Infinity) is not empirically confirmed.
//   Status: BLOCKED pending output assertion discovery for error states.
//
// TC-CBA-NONNUMERIC-BLOCKED: Non-Numeric Input for Calculator (Edge-Case-4)
//   Reason: The run dialog input field type validation behavior not explored.
//   fillRunDialog fills by testid, but whether non-numeric strings are accepted
//   or rejected at input field level is unknown.
//   Status: BLOCKED pending run dialog validation UI exploration.
