import { Locator, Page } from "@playwright/test";
import { getSelectors } from "../utils/selectors";
import { BasePage } from "./base.page";

export interface Agent {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  seeRunsUrl: string;
  openInBuilderUrl: string;
}

export class LibraryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async isLoaded(): Promise<boolean> {
    console.log(`checking if library page is loaded`);
    try {
      await this.page.waitForLoadState("domcontentloaded", { timeout: 10_000 });

      await this.page.waitForSelector('[data-testid="library-textbox"]', {
        state: "visible",
        timeout: 10_000,
      });

      // Wait for agent count badge to appear
      await this.page.waitForSelector('[data-testid="agents-count"]', {
        state: "visible",
        timeout: 10_000,
      });

      // Wait for agent cards OR empty state (count stable after spinner gone)
      // Poll until the agents-count badge no longer reflects a loading/"0" transient
      // by waiting for any agent card to appear OR by waiting for networkidle
      await this.page
        .waitForLoadState("networkidle", { timeout: 10_000 })
        .catch(() => {});

      console.log("Library page is loaded successfully");
      return true;
    } catch (error) {
      console.log("Library page failed to load:", error);
      return false;
    }
  }

  async navigateToLibrary(): Promise<void> {
    await this.page.goto("/library");
    await this.isLoaded();
  }

  async getAgentCount(): Promise<number> {
    const { getId } = getSelectors(this.page);
    const countText = await getId("agents-count").textContent();
    const match = countText?.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async getAgentCountByListLength(): Promise<number> {
    const { getId } = getSelectors(this.page);
    const agentCards = await getId("library-agent-card").all();
    return agentCards.length;
  }

  async searchAgents(searchTerm: string): Promise<void> {
    console.log(`searching for agents with term: ${searchTerm}`);
    const { getRole } = getSelectors(this.page);
    const searchInput = getRole("textbox", "Search agents");
    await searchInput.fill(searchTerm);

    await this.page.waitForTimeout(500);
  }

  async clearSearch(): Promise<void> {
    console.log(`clearing search`);
    try {
      // Look for the clear button (X icon)
      const clearButton = this.page.locator(".lucide.lucide-x");
      if (await clearButton.isVisible()) {
        await clearButton.click();
      } else {
        // If no clear button, clear the search input directly
        const searchInput = this.page.getByRole("textbox", {
          name: "Search agents",
        });
        await searchInput.fill("");
      }

      // Wait for results to update
      await this.page.waitForTimeout(500);
    } catch (error) {
      console.error("Error clearing search:", error);
    }
  }

  async selectSortOption(
    page: Page,
    sortOption: "Creation Date" | "Last Modified",
  ): Promise<void> {
    const { getRole } = getSelectors(page);
    await getRole("combobox").click();

    await getRole("option", sortOption).click();

    await this.page.waitForTimeout(500);
  }

  async getCurrentSortOption(): Promise<string> {
    console.log(`getting current sort option`);
    try {
      const sortCombobox = this.page.getByRole("combobox");
      const currentOption = await sortCombobox.textContent();
      return currentOption?.trim() || "";
    } catch (error) {
      console.error("Error getting current sort option:", error);
      return "";
    }
  }

  async openUploadDialog(): Promise<void> {
    console.log(`opening upload dialog`);
    await this.page.getByRole("button", { name: "Upload agent" }).click();

    // Wait for dialog to appear
    await this.page.getByRole("dialog", { name: "Upload Agent" }).waitFor({
      state: "visible",
      timeout: 5_000,
    });
  }

  async closeUploadDialog(): Promise<void> {
    await this.page.getByRole("button", { name: "Close" }).click();

    await this.page.getByRole("dialog", { name: "Upload Agent" }).waitFor({
      state: "hidden",
      timeout: 5_000,
    });
  }

  async isUploadDialogVisible(): Promise<boolean> {
    console.log(`checking if upload dialog is visible`);
    try {
      const dialog = this.page.getByRole("dialog", { name: "Upload Agent" });
      return await dialog.isVisible();
    } catch {
      return false;
    }
  }

  async fillUploadForm(agentName: string, description: string): Promise<void> {
    console.log(
      `filling upload form with name: ${agentName}, description: ${description}`,
    );

    // Fill agent name
    await this.page
      .getByRole("textbox", { name: "Agent name" })
      .fill(agentName);

    // Fill description
    await this.page
      .getByRole("textbox", { name: "Agent description" })
      .fill(description);
  }

  async isUploadButtonEnabled(): Promise<boolean> {
    console.log(`checking if upload button is enabled`);
    try {
      const uploadButton = this.page.getByRole("button", {
        name: "Upload",
      });
      return await uploadButton.isEnabled();
    } catch {
      return false;
    }
  }

  async getAgents(): Promise<Agent[]> {
    const { getId } = getSelectors(this.page);
    const agents: Agent[] = [];

    await getId("library-agent-card")
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    const agentCards = await getId("library-agent-card").all();

    for (const card of agentCards) {
      const name = await getId("library-agent-card-name", card).textContent();
      const seeRunsLink = getId("library-agent-card-see-runs-link", card);
      const openInBuilderLink = getId(
        "library-agent-card-open-in-builder-link",
        card,
      );

      const seeRunsUrl = await seeRunsLink.getAttribute("href");

      // Check if the "Open in builder" link exists before getting its href
      const openInBuilderLinkCount = await openInBuilderLink.count();
      const openInBuilderUrl =
        openInBuilderLinkCount > 0
          ? await openInBuilderLink.getAttribute("href")
          : null;

      if (name && seeRunsUrl) {
        const idMatch = seeRunsUrl.match(/\/library\/agents\/([^\/]+)/);
        const id = idMatch ? idMatch[1] : "";

        agents.push({
          id,
          name: name.trim(),
          description: "", // Description is not currently rendered in the card
          seeRunsUrl,
          openInBuilderUrl: openInBuilderUrl || "",
        });
      }
    }

    console.log(`found ${agents.length} agents`);
    return agents;
  }

  async clickAgent(agent: Agent): Promise<void> {
    const { getId } = getSelectors(this.page);
    const nameElement = getId("library-agent-card-name").filter({
      hasText: agent.name,
    });
    await nameElement.first().click();
  }

  async clickSeeRuns(agent: Agent): Promise<void> {
    console.log(`clicking see runs for agent: ${agent.name}`);

    const { getId } = getSelectors(this.page);
    const agentCard = getId("library-agent-card").filter({
      hasText: agent.name,
    });
    const seeRunsLink = getId("library-agent-card-see-runs-link", agentCard);
    await seeRunsLink.first().click();
  }

  async clickOpenInBuilder(agent: Agent): Promise<void> {
    console.log(`clicking open in builder for agent: ${agent.name}`);

    const { getId } = getSelectors(this.page);
    const agentCard = getId("library-agent-card").filter({
      hasText: agent.name,
    });
    const builderLink = getId(
      "library-agent-card-open-in-builder-link",
      agentCard,
    );
    await builderLink.first().click();
  }

  async waitForAgentsToLoad(): Promise<void> {
    const { getId } = getSelectors(this.page);
    await Promise.race([
      getId("library-agent-card")
        .first()
        .waitFor({ state: "visible", timeout: 10_000 }),
      getId("agents-count").waitFor({ state: "visible", timeout: 10_000 }),
    ]);
  }

  async clickMonitoringLink(): Promise<void> {
    console.log(`clicking monitoring link in alert`);
    await this.page.getByRole("link", { name: "here" }).click();
  }

  async isMonitoringAlertVisible(): Promise<boolean> {
    console.log(`checking if monitoring alert is visible`);
    try {
      const alertText = this.page.locator("text=/Prefer the old experience/");
      return await alertText.isVisible();
    } catch {
      return false;
    }
  }

  async getSearchValue(): Promise<string> {
    console.log(`getting search input value`);
    try {
      const searchInput = this.page.getByRole("textbox", {
        name: "Search agents",
      });
      return await searchInput.inputValue();
    } catch {
      return "";
    }
  }

  async hasNoAgentsMessage(): Promise<boolean> {
    const { getText } = getSelectors(this.page);
    const noAgentsText = getText("0 agents");
    return noAgentsText !== null;
  }

  async scrollToBottom(): Promise<void> {
    console.log(`scrolling to bottom to trigger pagination`);
    await this.page.keyboard.press("End");
    await this.page.waitForTimeout(1000);
  }

  async scrollDown(): Promise<void> {
    console.log(`scrolling down to trigger pagination`);
    await this.page.keyboard.press("PageDown");
    await this.page.waitForTimeout(1000);
  }

  async scrollToLoadMore(): Promise<void> {
    console.log(`scrolling to load more agents`);

    const initialCount = await this.getAgentCountByListLength();
    console.log(`Initial agent count (DOM cards): ${initialCount}`);

    await this.scrollToBottom();

    await this.page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch(() => console.log("Network idle timeout, continuing..."));

    await this.page
      .waitForFunction(
        (prevCount) =>
          document.querySelectorAll('[data-testid="library-agent-card"]')
            .length > prevCount,
        initialCount,
        { timeout: 5000 },
      )
      .catch(() => {});

    const newCount = await this.getAgentCountByListLength();
    console.log(`New agent count after scroll (DOM cards): ${newCount}`);
  }

  async testPagination(): Promise<{
    initialCount: number;
    finalCount: number;
    hasMore: boolean;
  }> {
    const initialCount = await this.getAgentCountByListLength();
    await this.scrollToLoadMore();
    const finalCount = await this.getAgentCountByListLength();

    const hasMore = finalCount > initialCount;
    return {
      initialCount,
      finalCount,
      hasMore,
    };
  }

  async getAgentsWithPagination(): Promise<Agent[]> {
    console.log(`getting all agents with pagination`);

    let allAgents: Agent[] = [];
    let previousCount = 0;
    let currentCount = 0;
    const maxAttempts = 5; // Prevent infinite loop
    let attempts = 0;

    do {
      previousCount = currentCount;

      // Get current agents
      const currentAgents = await this.getAgents();
      allAgents = currentAgents;
      currentCount = currentAgents.length;

      console.log(`Attempt ${attempts + 1}: Found ${currentCount} agents`);

      // Try to load more by scrolling
      await this.scrollToLoadMore();

      attempts++;
    } while (currentCount > previousCount && attempts < maxAttempts);

    console.log(`Total agents found with pagination: ${allAgents.length}`);
    return allAgents;
  }

  async waitForPaginationLoad(): Promise<void> {
    console.log(`waiting for pagination to load`);

    // Wait for any loading states to complete
    await this.page.waitForTimeout(1000);

    // Wait for agent count to stabilize
    let previousCount = 0;
    let currentCount = 0;
    let stableChecks = 0;
    const maxChecks = 5; // Reduced from 10 to prevent excessive waiting

    while (stableChecks < 2 && stableChecks < maxChecks) {
      currentCount = await this.getAgentCount();

      if (currentCount === previousCount) {
        stableChecks++;
      } else {
        stableChecks = 0;
      }

      previousCount = currentCount;
      if (stableChecks < 2) {
        // Only wait if we haven't stabilized yet
        await this.page.waitForTimeout(500);
      }
    }

    console.log(`Pagination load stabilized with ${currentCount} agents`);
  }

  async scrollAndWaitForNewAgents(): Promise<number> {
    const initialCount = await this.getAgentCountByListLength();

    await this.scrollDown();

    await this.waitForPaginationLoad();

    const finalCount = await this.getAgentCountByListLength();
    const newAgentsLoaded = finalCount - initialCount;

    console.log(
      `Loaded ${newAgentsLoaded} new agents (${initialCount} -> ${finalCount})`,
    );

    return newAgentsLoaded;
  }

  async isPaginationWorking(): Promise<boolean> {
    const newAgentsLoaded = await this.scrollAndWaitForNewAgents();
    return newAgentsLoaded > 0;
  }

  // ─── Delete Agent Methods (Empirically Verified) ───────────────────────────

  /**
   * Open the "More actions" dropdown for a specific agent card.
   * Empirically verified: button role="button" name="More actions" on library-agent-card
   */
  async openAgentActions(agentName: string): Promise<void> {
    console.log(`opening actions menu for agent: ${agentName}`);
    const { getId } = getSelectors(this.page);
    const card = getId("library-agent-card").filter({ hasText: agentName });
    await card.first().waitFor({ state: "visible", timeout: 10_000 });
    const moreActionsBtn = card.first().getByRole("button", { name: "More actions" });
    await moreActionsBtn.click();
  }

  /**
   * Click the "Delete agent" menu item in the More actions dropdown.
   * Empirically verified: menuitem "Delete agent" inside role="menu"
   */
  async clickDeleteAgentMenuItem(): Promise<void> {
    console.log(`clicking Delete agent menu item`);
    await this.page
      .getByRole("menuitem", { name: "Delete agent" })
      .waitFor({ state: "visible", timeout: 5_000 });
    await this.page.getByRole("menuitem", { name: "Delete agent" }).click();
  }

  /**
   * Verify the delete confirmation dialog is visible.
   * Empirically verified: role="dialog" name="Delete agent"
   * Message: "Are you sure you want to delete this agent? This action cannot be undone."
   */
  async isDeleteConfirmationDialogVisible(): Promise<boolean> {
    console.log(`checking if delete confirmation dialog is visible`);
    try {
      const dialog = this.page.getByRole("dialog", { name: "Delete agent" });
      return await dialog.isVisible({ timeout: 3_000 });
    } catch {
      return false;
    }
  }

  /**
   * Confirm deletion by clicking the "Delete Agent" button in the dialog.
   * Empirically verified: role="button" name="Delete Agent"
   */
  async confirmDeleteAgent(): Promise<void> {
    console.log(`confirming agent deletion`);
    const dialog = this.page.getByRole("dialog", { name: "Delete agent" });
    await dialog.waitFor({ state: "visible", timeout: 5_000 });
    await this.page.getByRole("button", { name: "Delete Agent" }).click();
    // Wait for dialog to close after deletion
    await dialog.waitFor({ state: "hidden", timeout: 10_000 });
  }

  /**
   * Cancel deletion by clicking the "Cancel" button in the dialog.
   * Empirically verified: role="button" name="Cancel"
   */
  async cancelDeleteAgent(): Promise<void> {
    console.log(`cancelling agent deletion`);
    const dialog = this.page.getByRole("dialog", { name: "Delete agent" });
    await dialog.waitFor({ state: "visible", timeout: 5_000 });
    await this.page.getByRole("button", { name: "Cancel" }).click();
    // Wait for dialog to close
    await dialog.waitFor({ state: "hidden", timeout: 5_000 });
    // Wait for Radix to remove all portals, overlays, and inert attributes
    await this.page
      .waitForFunction(
        () => {
          // Check there are no Radix dialog overlays left
          const overlay = document.querySelector("[data-radix-dialog-overlay]");
          // Check body doesn't have inert attribute (Radix sets it during dialog)
          const bodyInert = document.body.hasAttribute("inert");
          // Check no Radix portals with content remain
          const portals = document.querySelectorAll("[data-radix-popper-content-wrapper]");
          return !overlay && !bodyInert && portals.length === 0;
        },
        { timeout: 5_000 },
      )
      .catch(() => {});
    await this.page.waitForTimeout(300);
  }

  /**
   * Close deletion dialog using the X (Close) button.
   * Empirically verified: role="button" name="Close" inside the dialog
   */
  async closeDeleteDialogWithX(): Promise<void> {
    console.log(`closing delete dialog with X button`);
    const dialog = this.page.getByRole("dialog", { name: "Delete agent" });
    await dialog.waitFor({ state: "visible", timeout: 5_000 });
    await this.page.getByRole("button", { name: "Close" }).click();
    await dialog.waitFor({ state: "hidden", timeout: 5_000 });
    // Dismiss any lingering Radix dropdown overlay
    await this.page.keyboard.press("Escape");
    await this.page.waitForTimeout(300);
  }

  /**
   * Full delete agent flow: opens actions, clicks delete, confirms.
   * @param agentName - the name of the agent to delete
   */
  async deleteAgent(agentName: string): Promise<void> {
    console.log(`deleting agent: ${agentName}`);
    await this.openAgentActions(agentName);
    await this.clickDeleteAgentMenuItem();
    await this.confirmDeleteAgent();
  }

  // ─── Edit Agent Methods (Empirically Verified 2026-02-18) ─────────────────

  /**
   * Click the "Edit agent" menu item in the More actions dropdown.
   * Empirically verified: menuitem "Edit agent" inside role="menu" name="More actions"
   * IMPORTANT: This action opens a NEW TAB with the builder loaded.
   */
  async clickEditAgentMenuItem(): Promise<void> {
    console.log(`clicking Edit agent menu item`);
    await this.page
      .getByRole("menuitem", { name: "Edit agent" })
      .waitFor({ state: "visible", timeout: 5_000 });
    await this.page.getByRole("menuitem", { name: "Edit agent" }).click();
  }

  /**
   * Click the "Duplicate agent" menu item in the More actions dropdown.
   * Empirically verified: menuitem "Duplicate agent" inside role="menu".
   */
  async clickDuplicateAgentMenuItem(): Promise<void> {
    console.log(`clicking Duplicate agent menu item`);
    await this.page
      .getByRole("menuitem", { name: "Duplicate agent" })
      .waitFor({ state: "visible", timeout: 5_000 });
    await this.page.getByRole("menuitem", { name: "Duplicate agent" }).click();
  }

  /**
   * Click the "Open in builder" direct link on a library agent card.
   * This navigates within the same tab (no new tab).
   * Empirically verified: data-testid="library-agent-card-open-in-builder-link"
   * URL pattern: /build?flowID=<uuid>
   */
  async clickOpenInBuilderLink(agentName: string): Promise<void> {
    console.log(`clicking Open in builder link for agent: ${agentName}`);
    const { getId } = getSelectors(this.page);
    const agentCard = getId("library-agent-card").filter({ hasText: agentName });
    await agentCard.first().waitFor({ state: "visible", timeout: 10_000 });
    const builderLink = getId(
      "library-agent-card-open-in-builder-link",
      agentCard.first(),
    );
    await builderLink.waitFor({ state: "visible", timeout: 5_000 });
    await builderLink.click();
  }

  /**
   * Get the "Open in builder" href for a given agent card.
   * Returns the URL string pointing to /build?flowID=<uuid>
   */
  async getOpenInBuilderHref(agentName: string): Promise<string> {
    console.log(`getting Open in builder href for agent: ${agentName}`);
    const { getId } = getSelectors(this.page);
    const agentCard = getId("library-agent-card").filter({ hasText: agentName });
    await agentCard.first().waitFor({ state: "visible", timeout: 10_000 });
    const builderLink = getId(
      "library-agent-card-open-in-builder-link",
      agentCard.first(),
    );
    return (await builderLink.getAttribute("href")) ?? "";
  }

  /**
   * Verify the "Edit agent" menu item is present in the More actions dropdown.
   * Call openAgentActions() first to open the dropdown.
   */
  async isEditAgentMenuItemVisible(): Promise<boolean> {
    console.log(`checking if Edit agent menu item is visible`);
    try {
      const item = this.page.getByRole("menuitem", { name: "Edit agent" });
      return await item.isVisible({ timeout: 3_000 });
    } catch {
      return false;
    }
  }

  /**
   * Verify the "Duplicate agent" menu item is present in the More actions dropdown.
   * Call openAgentActions() first to open the dropdown.
   */
  async isDuplicateAgentMenuItemVisible(): Promise<boolean> {
    console.log(`checking if Duplicate agent menu item is visible`);
    try {
      const item = this.page.getByRole("menuitem", { name: "Duplicate agent" });
      return await item.isVisible({ timeout: 3_000 });
    } catch {
      return false;
    }
  }

  /**
   * Check whether an agent with a given name exists in the library.
   * Waits up to 15s for the card to appear (handles async list loading).
   */
  async agentExists(agentName: string): Promise<boolean> {
    console.log(`checking if agent exists: ${agentName}`);
    const { getId } = getSelectors(this.page);
    const card = getId("library-agent-card").filter({ hasText: agentName });
    try {
      await card.first().waitFor({ state: "visible", timeout: 15_000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the text content of the agents-count badge.
   * Empirically verified: data-testid="agents-count"
   */
  async getAgentCountText(): Promise<string> {
    const { getId } = getSelectors(this.page);
    return (await getId("agents-count").textContent()) || "0";
  }
}

// Locator functions
export function getLibraryTab(page: Page): Locator {
  return page.locator('a[href="/library"]');
}

export function getAgentCards(page: Page): Locator {
  return page.getByTestId("library-agent-card");
}

export function getNewRunButton(page: Page): Locator {
  return page.getByRole("button", { name: "New run" });
}

export function getAgentTitle(page: Page): Locator {
  return page.locator("h1").first();
}

// Action functions
export async function navigateToLibrary(page: Page): Promise<void> {
  await getLibraryTab(page).click();
  await page.waitForURL(/.*\/library/);
}

export async function clickFirstAgent(page: Page): Promise<void> {
  const firstAgent = getAgentCards(page).first();
  await firstAgent.click();
}

export async function navigateToAgentByName(
  page: Page,
  agentName: string,
): Promise<void> {
  const agentCard = getAgentCards(page).filter({ hasText: agentName }).first();
  // Wait for the agent card to be visible before clicking
  // This handles async loading of agents after page navigation
  await agentCard.waitFor({ state: "visible", timeout: 15000 });
  await agentCard.click();
}

export async function clickRunButton(page: Page): Promise<void> {
  const { getId } = getSelectors(page);

  // Wait for page to stabilize and buttons to render
  // The NewAgentLibraryView shows either "Setup your task" (empty state)
  // or "New task" (with items) button
  const setupTaskButton = page.getByRole("button", {
    name: /Setup your task/i,
  });
  const newTaskButton = page.getByRole("button", { name: /New task/i });
  const runButton = getId("agent-run-button");
  const runAgainButton = getId("run-again-button");

  // Use Promise.race with waitFor to wait for any of the buttons to appear
  // This handles the async rendering in CI environments
  try {
    await Promise.race([
      setupTaskButton.waitFor({ state: "visible", timeout: 15000 }),
      newTaskButton.waitFor({ state: "visible", timeout: 15000 }),
      runButton.waitFor({ state: "visible", timeout: 15000 }),
      runAgainButton.waitFor({ state: "visible", timeout: 15000 }),
    ]);
  } catch {
    throw new Error(
      "Could not find run/start task button - none of the expected buttons appeared",
    );
  }

  // Now check which button is visible and click it
  if (await setupTaskButton.isVisible()) {
    await setupTaskButton.click();
    const startTaskButton = page
      .getByRole("button", { name: /Start Task/i })
      .first();
    await startTaskButton.waitFor({ state: "visible", timeout: 10000 });
    await startTaskButton.click();
    return;
  }

  if (await newTaskButton.isVisible()) {
    await newTaskButton.click();
    const startTaskButton = page
      .getByRole("button", { name: /Start Task/i })
      .first();
    await startTaskButton.waitFor({ state: "visible", timeout: 10000 });
    await startTaskButton.click();
    return;
  }

  if (await runButton.isVisible()) {
    await runButton.click();
    return;
  }

  if (await runAgainButton.isVisible()) {
    await runAgainButton.click();
    return;
  }

  throw new Error("Could not find run/start task button");
}

export async function clickNewRunButton(page: Page): Promise<void> {
  await getNewRunButton(page).click();
}

export async function runAgent(page: Page): Promise<void> {
  await clickRunButton(page);
}

export async function waitForAgentPageLoad(page: Page): Promise<void> {
  await page.waitForURL(/.*\/library\/agents\/[^/]+/);
  await page.getByTestId("Run actions").isVisible({ timeout: 10000 });
}

export async function getAgentName(page: Page): Promise<string> {
  return (await getAgentTitle(page).textContent()) || "";
}

export async function isLoaded(page: Page): Promise<boolean> {
  return await page.locator("h1").isVisible();
}

export async function waitForRunToComplete(
  page: Page,
  timeout = 30000,
): Promise<void> {
  await page.waitForSelector(".bg-green-500, .bg-red-500, .bg-purple-500", {
    timeout,
  });
}

export async function getRunStatus(page: Page): Promise<string> {
  if (await page.locator(".animate-spin").isVisible()) {
    return "running";
  } else if (await page.locator(".bg-green-500").isVisible()) {
    return "completed";
  } else if (await page.locator(".bg-red-500").isVisible()) {
    return "failed";
  }
  return "unknown";
}
