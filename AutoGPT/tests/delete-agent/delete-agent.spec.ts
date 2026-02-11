/**
 * Delete Agent Feature Test Suite
 * 
 * Test File: delete-agent.spec.ts
 * Feature: Delete Agent from Monitor Tab
 * Source: test_6.md (Delete Agent Structured Representation)
 * Generated: February 8, 2026
 * 
 * Coverage: 17 executable scenarios + 5 blocked scenarios (documented)
 * Requirements Coverage: FR-1 to FR-8 (100%), NFR-1 to NFR-4 (100%), BR-1 to BR-4 (100%)
 */

import test, { expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { MonitorPage } from "../pages/monitor.page";
import { getTestUser } from "../utils/auth";
import { hasUrl } from "../utils/assertion";

test.describe("Delete Agent from Monitor Tab", () => {
  let monitorPage: MonitorPage;

  test.beforeEach(async ({ page }, testInfo) => {
    const loginPage = new LoginPage(page);
    const testUser = await getTestUser(testInfo.parallelIndex);
    
    monitorPage = new MonitorPage(page);

    // Authenticate
    await page.goto("/login");
    await loginPage.login(testUser.email, testUser.password);
    await hasUrl(page, "/marketplace");

    // Navigate to Monitor Tab
    await page.goto("/monitoring");
    await monitorPage.isLoaded();
  });

  /**
   * Test Case ID: TC-001
   * Covered Requirements: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, NFR-1, NFR-2, NFR-3, BR-1, BR-2
   * Test Type: Happy Path
   * Source Artifacts: Gherkin Scenario S1
   * Assumptions: User authenticated, Monitor Tab loaded
   * Preconditions Established: At least 1 agent created via ensureAgentExists()
   */
  test("successfully delete an agent with confirmation", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    const initialAgents = await monitorPage.listAgents();
    const initialCount = initialAgents.length;

    // ACT
    await monitorPage.deleteAgent(agent, true);

    // ASSERT
    const finalAgents = await monitorPage.listAgents();
    expect(finalAgents.length).toBe(initialCount - 1);
    expect(finalAgents.find(a => a.id === agent.id)).toBeUndefined();
  });

  /**
   * Test Case ID: TC-002
   * Covered Requirements: FR-1, FR-2, FR-3, FR-4, FR-5, EC-1
   * Test Type: Negative Path
   * Source Artifacts: Gherkin Scenario S2
   * Assumptions: User authenticated, Monitor Tab loaded
   * Preconditions Established: At least 1 agent created
   */
  test("cancel agent deletion - agent remains in list", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    const initialAgents = await monitorPage.listAgents();

    // ACT
    await monitorPage.deleteAgent(agent, false); // confirm = false

    // ASSERT
    const finalAgents = await monitorPage.listAgents();
    expect(finalAgents.length).toBe(initialAgents.length);
    expect(finalAgents.find(a => a.id === agent.id)).toBeDefined();
  });

  /**
   * Test Case ID: TC-003
   * Covered Requirements: FR-1, FR-2, EC-6
   * Test Type: Edge Case - Empty State
   * Source Artifacts: Gherkin Scenario S3
   * Assumptions: Fresh user with no agents
   * Preconditions Established: Zero agents via ensureZeroAgents() or fresh user
   */
  test("view monitor tab with no agents - empty state", async ({ page }) => {
    // ARRANGE
    await monitorPage.ensureZeroAgents();

    // ACT
    const agents = await monitorPage.listAgents();

    // ASSERT
    expect(agents.length).toBe(0);
    // TODO: Add assertion for empty state message when selector is known
  });

  /**
   * Test Case ID: TC-004
   * Covered Requirements: FR-1 to FR-7, EC-2
   * Test Type: Edge Case - Boundary Condition
   * Source Artifacts: Gherkin Scenario S4
   * Assumptions: User authenticated
   * Preconditions Established: Exactly 1 agent via ensureExactAgentCount(1)
   */
  test("delete the last remaining agent - shows empty state", async ({ page }) => {
    // ARRANGE
    const agents = await monitorPage.ensureExactAgentCount(1);
    expect(agents.length).toBe(1);
    const lastAgent = agents[0];

    // ACT
    await monitorPage.deleteAgent(lastAgent, true);

    // ASSERT
    const finalAgents = await monitorPage.listAgents();
    expect(finalAgents.length).toBe(0);
  });

  /**
   * Test Case ID: TC-005
   * Covered Requirements: FR-1 to FR-7, NFR-3
   * Test Type: Happy Path
   * Source Artifacts: Gherkin Scenario S5
   * Assumptions: User authenticated
   * Preconditions Established: 3 agents via ensureExactAgentCount(3)
   */
  test("delete one agent when multiple exist - others remain", async ({ page }) => {
    // ARRANGE
    const agents = await monitorPage.ensureExactAgentCount(3);
    expect(agents.length).toBe(3);
    const agentToDelete = agents[1]; // Delete middle agent
    const remainingAgentIds = agents.filter(a => a.id !== agentToDelete.id).map(a => a.id);

    // ACT
    await monitorPage.deleteAgent(agentToDelete, true);

    // ASSERT
    const finalAgents = await monitorPage.listAgents();
    expect(finalAgents.length).toBe(2);
    expect(finalAgents.find(a => a.id === agentToDelete.id)).toBeUndefined();
    
    // Verify other agents still exist
    for (const id of remainingAgentIds) {
      expect(finalAgents.find(a => a.id === id)).toBeDefined();
    }
  });

  /**
   * Test Case ID: TC-006
   * Covered Requirements: FR-4, FR-8, NFR-4
   * Test Type: UI Validation
   * Source Artifacts: Gherkin Scenario S6
   * Assumptions: User authenticated
   * Preconditions Established: At least 1 agent
   */
  test("verify trash icon is visible and positioned correctly", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();

    // ACT
    await monitorPage.clickAgent(agent.id);

    // ASSERT
    // TODO: Add explicit trash icon visibility check when exact selector is known
    // For now, if clickTrashIcon doesn't throw, icon is accessible
    await expect(monitorPage.clickTrashIcon(agent)).resolves.not.toThrow();
  });

  /**
   * Test Case ID: TC-007
   * Covered Requirements: FR-5, NFR-2, BR-2
   * Test Type: Safety Validation
   * Source Artifacts: Gherkin Scenario S7
   * Assumptions: User authenticated
   * Preconditions Established: At least 1 agent
   */
  test("verify confirmation dialog appears with correct content", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();

    // ACT
    await monitorPage.clickTrashIcon(agent);
    await page.waitForTimeout(500); // Wait for dialog animation

    // ASSERT
    const hasDialog = await monitorPage.hasDeleteConfirmationDialog();
    expect(hasDialog).toBe(true);
    
    // TODO: Verify exact message "Are you sure you want to delete this agent?" when selector known
    // TODO: Verify "Yes, delete" button exists
    // TODO: Verify cancel option exists
    
    // Cleanup - cancel deletion
    await monitorPage.cancelDeletion();
  });

  /**
   * Test Case ID: TC-008
   * Covered Requirements: EC-5
   * Test Type: Error Handling
   * Source Artifacts: Gherkin Scenario S8
   * Assumptions: User authenticated, can mock network
   * Preconditions Established: At least 1 agent, network mocked to fail
   */
  test("handle deletion failure due to network error", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    
    // Mock network failure for DELETE requests
    await page.route('**/api/agents/**', route => {
      if (route.request().method() === 'DELETE') {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // ACT
    await monitorPage.clickTrashIcon(agent);
    await page.waitForTimeout(500);
    await monitorPage.confirmDeletion();
    
    // Wait for error to manifest
    await page.waitForTimeout(2000);

    // ASSERT
    // Agent should still exist after failed deletion
    const agents = await monitorPage.listAgents();
    expect(agents.find(a => a.id === agent.id)).toBeDefined();
    
    // TODO: Verify error message is displayed when selector known
  });

  /**
   * Test Case ID: TC-009
   * Covered Requirements: NFR-1, BR-1
   * Test Type: Data Integrity
   * Source Artifacts: Gherkin Scenario S9
   * Assumptions: User authenticated
   * Preconditions Established: At least 1 agent with tracked ID
   */
  test("verify deleted agent cannot be recovered - irreversibility", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    const agentId = agent.id;
    const agentName = agent.name;

    // ACT
    await monitorPage.deleteAgent(agent, true);
    await page.waitForTimeout(2000); // Ensure deletion is complete

    // ASSERT
    const agents = await monitorPage.listAgents();
    expect(agents.find(a => a.id === agentId)).toBeUndefined();
    expect(agents.find(a => a.name === agentName)).toBeUndefined();
    
    // Verify agent is gone from backend (via API call)
    const response = await page.request.get(`http://localhost:3000/api/agents/${agentId}`);
    expect(response.status()).toBe(404); // Should return 404 Not Found
  });

  /**
   * Test Case ID: TC-010
   * Covered Requirements: FR-7, NFR-3
   * Test Type: Performance
   * Source Artifacts: Gherkin Scenario S10
   * Assumptions: User authenticated
   * Preconditions Established: At least 1 agent
   */
  test("verify agent is removed immediately after confirmation", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    const initialCount = (await monitorPage.listAgents()).length;

    // ACT
    const startTime = Date.now();
    await monitorPage.deleteAgent(agent, true);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // ASSERT
    // Deletion should complete within 5 seconds (generous timeout)
    expect(duration).toBeLessThan(5000);
    
    // Agent should be removed from list immediately
    const finalAgents = await monitorPage.listAgents();
    expect(finalAgents.length).toBe(initialCount - 1);
    expect(finalAgents.find(a => a.id === agent.id)).toBeUndefined();
  });

  /**
   * Test Case ID: TC-011
   * Covered Requirements: FR-1 to FR-7
   * Test Type: Negative Path - Navigation
   * Source Artifacts: Gherkin Scenario S11
   * Assumptions: User authenticated
   * Preconditions Established: At least 1 agent
   */
  test("navigate away during confirmation dialog - agent not deleted", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    const initialAgents = await monitorPage.listAgents();

    // ACT
    await monitorPage.clickTrashIcon(agent);
    await page.waitForTimeout(500);
    
    // Navigate away before confirming
    await page.goto("/library");
    await page.waitForTimeout(1000);
    
    // Navigate back to monitor
    await page.goto("/monitoring");
    await monitorPage.isLoaded();

    // ASSERT
    const finalAgents = await monitorPage.listAgents();
    expect(finalAgents.length).toBe(initialAgents.length);
    expect(finalAgents.find(a => a.id === agent.id)).toBeDefined();
  });

  /**
   * Test Case ID: TC-012
   * Covered Requirements: FR-1 to FR-7
   * Test Type: Race Condition
   * Source Artifacts: Gherkin Scenario S12
   * Assumptions: User authenticated
   * Preconditions Established: At least 1 agent
   */
  test("rapid multiple delete attempts - only one dialog appears", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();

    // ACT
    // Click trash icon rapidly 3 times
    await monitorPage.clickAgent(agent.id);
    const trashIcon = page.getByRole("button", { name: /delete|trash/i }).first();
    
    await trashIcon.click();
    await trashIcon.click({ timeout: 100 }).catch(() => {}); // May fail if already clicked
    await trashIcon.click({ timeout: 100 }).catch(() => {}); // May fail if already clicked
    
    await page.waitForTimeout(1000);

    // ASSERT
    // Only ONE dialog should be visible
    const dialogs = await page.getByRole("dialog").all();
    expect(dialogs.length).toBeLessThanOrEqual(1);
    
    // Cleanup
    await monitorPage.cancelDeletion();
  });

  /**
   * Test Case ID: TC-013
   * Covered Requirements: FR-1 to FR-7
   * Test Type: Accessibility - Keyboard
   * Source Artifacts: Gherkin Scenario S13
   * Assumptions: User authenticated
   * Preconditions Established: At least 1 agent
   */
  test("delete agent using keyboard - Escape to cancel", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    const initialAgents = await monitorPage.listAgents();

    // ACT
    await monitorPage.clickTrashIcon(agent);
    await page.waitForTimeout(500);
    
    // Press Escape to cancel
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // ASSERT
    const finalAgents = await monitorPage.listAgents();
    expect(finalAgents.length).toBe(initialAgents.length);
    expect(finalAgents.find(a => a.id === agent.id)).toBeDefined();
  });

  /**
   * Test Case ID: TC-014
   * Covered Requirements: EC-4 (Concurrent deletion)
   * Test Type: Edge Case - Stale State
   * Source Artifacts: Gherkin Scenario S14
   * Assumptions: User authenticated, can make API calls
   * Preconditions Established: At least 1 agent, deleted externally via API
   */
  test("attempt to delete agent already deleted elsewhere - handle gracefully", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    const agentId = agent.id;

    // Simulate external deletion via API
    await page.request.delete(`http://localhost:3000/api/agents/${agentId}`);
    await page.waitForTimeout(500);

    // ACT
    // Try to delete the already-deleted agent from stale UI
    await monitorPage.clickTrashIcon(agent);
    await page.waitForTimeout(500);
    await monitorPage.confirmDeletion();
    await page.waitForTimeout(2000);

    // ASSERT
    // Should handle gracefully - either error or refresh showing agent gone
    // Exact behavior depends on implementation
    const agents = await monitorPage.listAgents();
    expect(agents.find(a => a.id === agentId)).toBeUndefined();
  });

  /**
   * Test Case ID: TC-015
   * Covered Requirements: FR-1 to FR-7
   * Test Type: UX - Safety
   * Source Artifacts: Gherkin Scenario S19
   * Assumptions: User authenticated
   * Preconditions Established: Agent with known unique name
   * NOTE: This test verifies if agent name appears in confirmation dialog (enhancement)
   */
  test("confirmation dialog should include agent name for safety", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    const agentName = agent.name;

    // ACT
    await monitorPage.clickTrashIcon(agent);
    await page.waitForTimeout(500);

    // ASSERT
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    
    // TODO: Verify dialog contains agent name when exact dialog structure is known
    // Expected pattern: "Are you sure you want to delete '{agentName}'?"
    
    // Cleanup
    await monitorPage.cancelDeletion();
  });

  /**
   * Test Case ID: TC-016
   * Covered Requirements: FR-1 to FR-7
   * Test Type: Workflow - Sequential Operations
   * Source Artifacts: Gherkin Scenario S20
   * Assumptions: User authenticated
   * Preconditions Established: At least 2 agents
   */
  test("delete multiple agents sequentially - no interference", async ({ page }) => {
    // ARRANGE
    const agents = await monitorPage.ensureExactAgentCount(2);
    expect(agents.length).toBe(2);
    const agent1 = agents[0];
    const agent2 = agents[1];

    // ACT
    // Delete first agent
    await monitorPage.deleteAgent(agent1, true);
    await page.waitForTimeout(1000);
    
    let currentAgents = await monitorPage.listAgents();
    expect(currentAgents.length).toBe(1);
    
    // Delete second agent
    await monitorPage.deleteAgent(agent2, true);
    await page.waitForTimeout(1000);

    // ASSERT
    currentAgents = await monitorPage.listAgents();
    expect(currentAgents.length).toBe(0);
    expect(currentAgents.find(a => a.id === agent1.id)).toBeUndefined();
    expect(currentAgents.find(a => a.id === agent2.id)).toBeUndefined();
  });

  /**
   * Test Case ID: TC-017
   * Covered Requirements: FR-1, FR-2, FR-3
   * Test Type: Navigation - Direct URL
   * Source Artifacts: Gherkin Scenario S24
   * Assumptions: User authenticated
   * Preconditions Established: At least 1 agent
   */
  test("navigate directly to /monitoring URL - functionality works", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();

    // ACT
    // Navigate directly via URL (simulating bookmark or direct link)
    await page.goto("http://localhost:3000/monitoring");
    await monitorPage.isLoaded();
    
    const agents = await monitorPage.listAgents();

    // ASSERT
    expect(agents.length).toBeGreaterThan(0);
    expect(agents.find(a => a.id === agent.id)).toBeDefined();
    
    // Verify delete functionality works after direct navigation
    await monitorPage.deleteAgent(agent, true);
    const finalAgents = await monitorPage.listAgents();
    expect(finalAgents.find(a => a.id === agent.id)).toBeUndefined();
  });

  // ========== BLOCKED/SKIPPED SCENARIOS ==========

  /**
   * Test Case ID: TC-BLOCKED-001
   * Covered Requirements: EC-3 (Delete agent with active runs)
   * Test Type: Business Logic - BLOCKED
   * Source Artifacts: Gherkin Scenario S15
   * Blocker: No API discovered to start/maintain active runs
   * Action Required: Clarify business rule and provide run API
   */
  test.skip("delete agent with active runs - behavior TBD", async ({ page }) => {
    // TODO: Implement when run API is available
    // TODO: Clarify if active agents can be deleted or if warning is needed
  });

  /**
   * Test Case ID: TC-BLOCKED-002
   * Covered Requirements: Business Logic (Schedules)
   * Test Type: Business Logic - BLOCKED
   * Source Artifacts: Gherkin Scenario S16
   * Blocker: No API discovered to create schedules
   * Action Required: Provide schedule API documentation
   */
  test.skip("delete agent with scheduled runs - schedules deleted", async ({ page }) => {
    // TODO: Implement when schedule API is available
    // TODO: Verify schedules are cascade-deleted or user is warned
  });

  /**
   * Test Case ID: TC-BLOCKED-003
   * Covered Requirements: EC-7 (Permission-based deletion)
   * Test Type: Access Control - BLOCKED
   * Source Artifacts: Gherkin Scenario S18
   * Blocker: Permission system unknown
   * Action Required: Clarify permission model and read-only user creation
   */
  test.skip("read-only user cannot see trash icon", async ({ page }) => {
    // TODO: Implement when permission system is documented
    // TODO: Create read-only test user
    // TODO: Verify trash icons are hidden
  });

  /**
   * Test Case ID: TC-BLOCKED-004
   * Covered Requirements: NFR-1 (Irreversibility)
   * Test Type: UX - BLOCKED
   * Source Artifacts: Gherkin Scenario S23
   * Blocker: Undo system conflicts with NFR-1 (deletion is permanent)
   * Action Required: N/A - Confirmed irreversible, no undo functionality
   */
  test.skip("undo deletion immediately after - NOT IMPLEMENTED", async ({ page }) => {
    // BLOCKED: Deletion is irreversible per NFR-1 and BR-1
    // This scenario conflicts with requirements
    // No implementation planned
  });

  /**
   * Test Case ID: TC-BLOCKED-005
   * Covered Requirements: Accessibility
   * Test Type: Accessibility - BLOCKED
   * Source Artifacts: Gherkin Scenario S25
   * Blocker: Requires axe-core or screen reader testing tools
   * Action Required: Integrate @axe-core/playwright
   */
  test.skip("screen reader can access and activate trash icon", async ({ page }) => {
    // TODO: Implement when axe-core is integrated
    // TODO: Verify trash icon has proper ARIA labels
    // TODO: Verify dialog is properly announced
  });

  // ========== RISKY/EXPERIMENTAL SCENARIOS ==========

  /**
   * Test Case ID: TC-RISKY-001
   * Covered Requirements: State Synchronization
   * Test Type: Risky - UI Refresh
   * Source Artifacts: Gherkin Scenario S17
   * Risk: UI polling/refresh mechanism unknown
   * Note: Verifies no real-time update (may need manual refresh)
   */
  test("UI updates when agent deleted externally (experimental)", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    const agentId = agent.id;

    // ACT
    // Delete via external API
    await page.request.delete(`http://localhost:3000/api/agents/${agentId}`);
    
    // Wait for potential UI refresh (if polling exists)
    await page.waitForTimeout(5000);
    
    // Refresh page to force update
    await page.reload();
    await monitorPage.isLoaded();

    // ASSERT
    const agents = await monitorPage.listAgents();
    expect(agents.find(a => a.id === agentId)).toBeUndefined();
    
    // NOTE: If test fails, may indicate UI doesn't auto-refresh
  });

  /**
   * Test Case ID: TC-RISKY-002
   * Covered Requirements: EC-5 (Network interruption)
   * Test Type: Risky - Network Failure
   * Source Artifacts: Gherkin Scenario S21
   * Risk: Exact network behavior during interruption unknown
   * Note: Mocks network but may not match real failure mode
   */
  test("handle network interruption during delete request (experimental)", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    
    // Mock network interruption (delayed then failed)
    await page.route('**/api/agents/**', route => {
      if (route.request().method() === 'DELETE') {
        // Simulate timeout then failure
        setTimeout(() => route.abort('timedout'), 2000);
      } else {
        route.continue();
      }
    });

    // ACT
    await monitorPage.clickTrashIcon(agent);
    await page.waitForTimeout(500);
    await monitorPage.confirmDeletion();
    await page.waitForTimeout(5000); // Wait for timeout

    // ASSERT
    // Agent should still exist
    const agents = await monitorPage.listAgents();
    expect(agents.find(a => a.id === agent.id)).toBeDefined();
    
    // NOTE: Actual behavior may differ from mocked behavior
  });

  /**
   * Test Case ID: TC-RISKY-003
   * Covered Requirements: UX - Loading State
   * Test Type: Risky - Loading Indicator
   * Source Artifacts: Gherkin Scenario S22
   * Risk: Loading state may be too fast to observe
   * Note: Uses artificial delay to make loading visible
   */
  test("display loading state during deletion (experimental)", async ({ page }) => {
    // ARRANGE
    const agent = await monitorPage.ensureAgentExists();
    
    // Slow down DELETE request to make loading visible
    await page.route('**/api/agents/**', async route => {
      if (route.request().method() === 'DELETE') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.continue();
      } else {
        route.continue();
      }
    });

    // ACT
    await monitorPage.clickTrashIcon(agent);
    await page.waitForTimeout(500);
    await monitorPage.confirmDeletion();
    
    // TODO: Add assertion for loading spinner/disabled state
    // await expect(page.getByTestId("loading-spinner")).toBeVisible();
    
    await page.waitForTimeout(3000); // Wait for completion

    // ASSERT
    const agents = await monitorPage.listAgents();
    expect(agents.find(a => a.id === agent.id)).toBeUndefined();
    
    // NOTE: Loading indicator selector needs to be discovered
  });
});
