import { Page } from "@playwright/test";
import { BasePage } from "./base.page";
import path from "path";

interface Agent {
  id: string;
  name: string;
  runCount: number;
  lastRun: string;
}

interface Run {
  id: string;
  agentId: string;
  agentName: string;
  started: string;
  duration: number;
  status: string;
}

interface Schedule {
  id: string;
  graphName: string;
  nextExecution: string;
  schedule: string;
  actions: string[];
}

enum ImportType {
  AGENT = "agent",
  TEMPLATE = "template",
}

export class MonitorPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async isLoaded(): Promise<boolean> {
    console.log(`checking if monitor page is loaded`);
    try {
      // Check for error state first and retry if needed
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const errorButton = this.page.getByRole("button", { name: "Try Again" });
        if (await errorButton.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`Error state detected on monitor page (attempt ${attempt}/${maxRetries}), clicking Try Again`);
          await errorButton.click();
          await this.page.waitForTimeout(2000); // Wait for reload
          continue;
        }
        break; // No error, proceed
      }

      // Wait for the monitor page
      await this.page.getByTestId("monitor-page").waitFor({
        state: "visible",
        timeout: 10_000,
      });

      // Wait for table headers to be visible (indicates table structure is ready)
      await this.page.locator("thead th").first().waitFor({
        state: "visible",
        timeout: 15_000,
      });

      // Wait for either a table row or an empty tbody to be present
      await Promise.race([
        // Wait for at least one row
        this.page.locator("tbody tr[data-testid]").first().waitFor({
          state: "visible",
          timeout: 15_000,
        }),
        // OR wait for an empty tbody (indicating no agents but table is loaded)
        this.page
          .locator("tbody[data-testid='agent-flow-list-body']:empty")
          .waitFor({
            state: "visible",
            timeout: 15_000,
          }),
      ]);

      return true;
    } catch {
      return false;
    }
  }

  async listAgents(): Promise<Agent[]> {
    console.log(`listing agents`);
    // Wait for table rows to be available
    const rows = await this.page.locator("tbody tr[data-testid]").all();

    const agents: Agent[] = [];

    for (const row of rows) {
      // Get the id from data-testid attribute
      const id = (await row.getAttribute("data-testid")) || "";

      // Get columns - there are 3 cells per row (name, run count, last run)
      const cells = await row.locator("td").all();

      // Extract name from first cell
      const name = (await row.getAttribute("data-name")) || "";

      // Extract run count from second cell
      const runCountText = (await cells[1].textContent()) || "0";
      const runCount = parseInt(runCountText, 10);

      // Extract last run from third cell's title attribute (contains full timestamp)
      // If no title, the cell will be empty indicating no last run
      const lastRunCell = cells[2];
      const lastRun = (await lastRunCell.getAttribute("title")) || "";

      agents.push({
        id,
        name,
        runCount,
        lastRun,
      });
    }

    agents.reduce((acc, agent) => {
      if (!agent.id.includes("flow-run")) {
        acc.push(agent);
      }
      return acc;
    }, [] as Agent[]);

    return agents;
  }

  async listRuns(filter?: Agent): Promise<Run[]> {
    console.log(`listing runs`);
    // Wait for the runs table to be loaded - look for table header "Agent"
    await this.page.locator("[data-testid='flow-runs-list-body']").waitFor({
      timeout: 10000,
    });

    // Get all run rows
    const rows = await this.page
      .locator('tbody tr[data-testid^="flow-run-"]')
      .all();

    const runs: Run[] = [];

    for (const row of rows) {
      const runId = (await row.getAttribute("data-runid")) || "";
      const agentId = (await row.getAttribute("data-graphid")) || "";

      // Get columns
      const cells = await row.locator("td").all();

      // Parse data from cells
      const agentName = (await cells[0].textContent()) || "";
      const started = (await cells[1].textContent()) || "";
      const status = (await cells[2].locator("div").textContent()) || "";
      const duration = (await cells[3].textContent()) || "";

      // Only add if no filter or if matches filter
      if (!filter || filter.id === agentId) {
        runs.push({
          id: runId,
          agentId: agentId,
          agentName: agentName.trim(),
          started: started.trim(),
          duration: parseFloat(duration.replace("s", "")),
          status: status.toLowerCase().trim(),
        });
      }
    }

    return runs;
  }
  async listSchedules(): Promise<Schedule[]> {
    console.log(`listing schedules`);
    return [];
  }

  async clickAgent(id: string) {
    console.log(`selecting agent ${id}`);
    await this.page.getByTestId(id).click();
  }

  async clickCreateAgent(): Promise<void> {
    console.log(`clicking create agent`);
    await this.page.getByRole("link", { name: "Create" }).click();
  }

  async importFromFile(
    directory: string,
    file: string,
    name?: string,
    description?: string,
    importType: ImportType = ImportType.AGENT,
  ) {
    console.log(
      `importing from directory: ${directory} file: ${file} name: ${name} description: ${description} importType: ${importType}`,
    );
    await this.page.getByTestId("create-agent-dropdown").click();
    await this.page.getByTestId("import-agent-from-file").click();

    await this.page
      .getByTestId("import-agent-file-input")
      .setInputFiles(path.join(directory, file));
    if (name) {
      console.log(`filling agent name: ${name}`);
      await this.page.getByTestId("agent-name-input").fill(name);
    }
    if (description) {
      console.log(`filling agent description: ${description}`);
      await this.page.getByTestId("agent-description-input").fill(description);
    }
    if (importType === ImportType.TEMPLATE) {
      console.log(`clicking import as template switch`);
      await this.page.getByTestId("import-as-template-switch").click();
    }
    console.log(`clicking import agent submit`);
    await this.page.getByTestId("import-agent-submit").click();
  }

  /**
   * Click the trash/delete icon for an agent
   * FINDING: Clicking agent navigates to broken detail page.
   * Solution: Look for trash icon directly without clicking agent first.
   */
  async clickTrashIcon(agent: Agent): Promise<void> {
    console.log(`clicking trash icon for agent ${agent.id} ${agent.name}`);
    
    // Strategy 1: Look for any delete/trash button with agent context
    // Try various selectors that might contain the agent ID or be near the agent row
    const agentRow = this.page.getByTestId(agent.id);
    
    // Try to find trash icon using various methods
    const selectors = [
      // Within the row, look for button with trash/delete text
      () => agentRow.getByRole("button", { name: /delete|trash/i }),
      // Within the row, look for button with specific test ID
      () => agentRow.getByTestId("delete-agent-button"),
      // Within the row, look for button containing trash icon (lucide-trash class)
      () => agentRow.locator("button:has(svg.lucide-trash)"),
      // Within the row, any button with delete-related test ID
      () => agentRow.locator("[data-testid*='delete']"),
      // Look for image/icon alt text
      () => agentRow.locator("button img[alt*='delete'], button img[alt*='trash']"),
    ];

    // Try each selector with short timeout
    for (const getSelector of selectors) {
      try {
        const icon = getSelector();
        if (await icon.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`Found trash icon using selector strategy`);
          await icon.click();
          return;
        }
      } catch {
        // Continue to next strategy
      }
    }
    
    // Strategy 2: Hover over row to reveal hidden buttons
    console.log(`Trying hover strategy`);
    await agentRow.hover();
    await this.page.waitForTimeout(500);
    
    for (const getSelector of selectors) {
      try {
        const icon = getSelector();
        if (await icon.isVisible({ timeout: 1000 }).catch(() => false)) {
          console.log(`Found trash icon after hover`);
          await icon.click();
          return;
        }
      } catch {
        // Continue
      }
    }

    throw new Error(`Could not find trash icon for agent ${agent.id}. The delete button may not be implemented in the UI yet.`);
  }

  /**
   * Check if delete confirmation dialog is visible
   * TODO: Verify selector - assumed based on common patterns
   */
  async hasDeleteConfirmationDialog(): Promise<boolean> {
    console.log(`checking for delete confirmation dialog`);
    try {
      // Strategy 1: role="dialog"
      const dialog = this.page.getByRole("dialog");
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        return true;
      }
      
      // Strategy 2: data-testid
      const dialogByTestId = this.page.getByTestId("delete-confirmation-dialog");
      if (await dialogByTestId.isVisible({ timeout: 1000 }).catch(() => false)) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Confirm deletion by clicking "Yes, delete" button
   * TODO: Verify selector - assumed based on common patterns
   */
  async confirmDeletion(): Promise<void> {
    console.log(`confirming deletion`);
    
    // Wait for dialog to be visible
    await this.page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
    
    // Try multiple selector strategies
    // Strategy 1: role="button" with name pattern
    const confirmByRole = this.page.getByRole("button", { name: /yes.*delete|confirm|delete/i });
    if (await confirmByRole.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmByRole.click();
      return;
    }
    
    // Strategy 2: data-testid
    const confirmByTestId = this.page.getByTestId("confirm-delete-button");
    if (await confirmByTestId.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmByTestId.click();
      return;
    }
    
    // Strategy 3: text content
    await this.page.getByText(/yes.*delete/i).click();
  }

  /**
   * Cancel deletion by clicking cancel button or dismissing dialog
   * TODO: Verify selector - assumed based on common patterns
   */
  async cancelDeletion(): Promise<void> {
    console.log(`canceling deletion`);
    
    // Try multiple selector strategies
    // Strategy 1: role="button" with name pattern
    const cancelByRole = this.page.getByRole("button", { name: /cancel|no/i });
    if (await cancelByRole.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelByRole.click();
      return;
    }
    
    // Strategy 2: data-testid
    const cancelByTestId = this.page.getByTestId("cancel-delete-button");
    if (await cancelByTestId.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelByTestId.click();
      return;
    }
    
    // Strategy 3: Escape key
    await this.page.keyboard.press("Escape");
  }

  /**
   * Delete an agent with optional confirmation
   * @param agent - The agent to delete
   * @param confirm - Whether to confirm the deletion (default: true)
   */
  async deleteAgent(agent: Agent, confirm: boolean = true): Promise<void> {
    console.log(`deleting agent ${agent.id} ${agent.name}`);
    
    // Click trash icon
    await this.clickTrashIcon(agent);
    
    // Wait for confirmation dialog
    await this.page.waitForTimeout(500); // Brief wait for dialog animation
    
    if (confirm) {
      await this.confirmDeletion();
      
      // Wait for deletion to complete
      await this.page.waitForTimeout(1000);
    } else {
      await this.cancelDeletion();
    }
  }

  /**
   * Ensure at least one agent exists, creating one if necessary
   * Returns the agent (either existing or newly created)
   */
  async ensureAgentExists(name?: string): Promise<Agent> {
    console.log(`ensuring agent exists${name ? ` with name: ${name}` : ""}`);
    
    const agents = await this.listAgents();
    
    // If name specified, check if it exists
    if (name) {
      const existing = agents.find(a => a.name === name);
      if (existing) {
        console.log(`agent ${name} already exists`);
        return existing;
      }
    } else if (agents.length > 0) {
      // No name specified, return any existing agent
      console.log(`using existing agent: ${agents[0].name}`);
      return agents[0];
    }
    
    // Need to create an agent
    console.log(`creating new agent via Build page`);
    
    // Navigate to Build page
    await this.navbar.clickBuildLink();
    
    // Import BuildPage here to avoid circular dependency
    const { BuildPage } = await import("./build.page");
    const buildPage = new BuildPage(this.page);
    
    await buildPage.closeTutorial();
    
    // Create dummy agent
    await buildPage.createDummyAgent();
    
    // Navigate back to monitor
    await this.page.goto("/monitoring");
    await this.isLoaded();
    
    // Get the newly created agent
    const updatedAgents = await this.listAgents();
    const newAgent = updatedAgents.find(a => 
      !agents.some(existing => existing.id === a.id)
    );
    
    if (!newAgent) {
      throw new Error("Failed to create agent - agent not found after creation");
    }
    
    console.log(`created new agent: ${newAgent.name} (${newAgent.id})`);
    return newAgent;
  }

  /**
   * Ensure exactly N agents exist
   * Deletes excess or creates missing agents
   */
  async ensureExactAgentCount(count: number): Promise<Agent[]> {
    console.log(`ensuring exactly ${count} agents exist`);
    
    let agents = await this.listAgents();
    
    // Delete excess
    while (agents.length > count) {
      console.log(`deleting excess agent: ${agents[0].name}`);
      await this.deleteAgent(agents[0], true);
      agents = await this.listAgents();
    }
    
    // Create missing
    while (agents.length < count) {
      console.log(`creating agent ${agents.length + 1} of ${count}`);
      await this.ensureAgentExists();
      agents = await this.listAgents();
    }
    
    console.log(`agent count is now ${agents.length}`);
    return agents;
  }

  /**
   * Ensure zero agents exist (cleanup helper)
   */
  async ensureZeroAgents(): Promise<void> {
    console.log(`ensuring zero agents exist`);
    
    let agents = await this.listAgents();
    
    while (agents.length > 0) {
      console.log(`deleting agent: ${agents[0].name}`);
      await this.deleteAgent(agents[0], true);
      agents = await this.listAgents();
    }
    
    console.log(`all agents deleted`);
  }

  async clickAllVersions(agent: Agent) {
    console.log(`clicking all versions for agent ${agent.id} ${agent.name}`);
  }

  async openInBuilder(agent: Agent) {
    console.log(`opening agent ${agent.id} ${agent.name} in builder`);
  }

  async exportToFile(agent: Agent) {
    await this.clickAgent(agent.id);

    console.log(`exporting agent id: ${agent.id} name: ${agent.name} to file`);
    await this.page.getByTestId("export-button").click();
  }

  async selectRun(agent: Agent, run: Run) {
    console.log(`selecting run ${run.id} for agent ${agent.id} ${agent.name}`);
  }

  async openOutputs(agent: Agent, run: Run) {
    console.log(
      `opening outputs for run ${run.id} of agent ${agent.id} ${agent.name}`,
    );
  }
}
