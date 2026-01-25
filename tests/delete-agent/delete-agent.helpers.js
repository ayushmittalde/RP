import path from "path";
import { expect } from "@playwright/test";
import { getTestUser } from "./utils/auth";

// Default test user pulled from env or fallback credentials used in example resources
export const TEST_USER = getTestUser();

// Reuse the fixture agent JSON bundled with the workspace
export const TEST_AGENT_FIXTURE_PATH = path.resolve(
  __dirname,
  "../../Resources/example_test/assets/testing_agent.json",
);

export async function login(page, user = TEST_USER) {
  await page.goto("/login");

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible({ timeout: 10000 });

  await emailInput.fill(user.email);
  await passwordInput.fill(user.password);

  const loginButton = page.getByRole("button", { name: /login/i });
  await expect(loginButton).toBeEnabled({ timeout: 10000 });

  await Promise.all([
    page.waitForURL(
      (url) =>
        /\/((marketplace|library|monitor)(\/.*)?|onboarding(\/.*)?)$/.test(
          url.pathname,
        ),
      { timeout: 15000 },
    ),
    loginButton.click(),
  ]);

  // Ensure the landing page has settled
  await page.waitForLoadState("networkidle", { timeout: 15000 });
}

export async function gotoMonitor(page) {
  // Attempt direct navigation first
  await page.goto("/monitor");

  const monitorRoot = page.getByTestId("monitor-page");
  await expect(monitorRoot).toBeVisible({ timeout: 15000 });

  // Wait for either rows or an empty table body
  const rows = page.locator("tbody tr[data-testid]");
  const emptyBody = page.locator("tbody[data-testid='agent-flow-list-body']:empty");
  await Promise.race([
    rows.first().waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
    emptyBody.waitFor({ state: "visible", timeout: 15000 }).catch(() => {}),
  ]);
}

export function agentRow(page, name) {
  return page.locator(`tbody tr[data-testid][data-name*="${name}"]`);
}

export async function ensureAgentPresent(page, name, description = "") {
  const row = agentRow(page, name);
  if ((await row.count()) > 0) {
    return row.first();
  }

  // Import via Monitor "Create" dropdown
  const createDropdown = page.getByTestId("create-agent-dropdown");
  await expect(createDropdown).toBeVisible({ timeout: 10000 });
  await createDropdown.click();
  await page.getByTestId("import-agent-from-file").click();

  const fileInput = page.getByTestId("import-agent-file-input");
  await expect(fileInput).toBeVisible({ timeout: 10000 });
  await fileInput.setInputFiles(TEST_AGENT_FIXTURE_PATH);

  if (name) {
    const nameInput = page.getByTestId("agent-name-input");
    await expect(nameInput).toBeVisible();
    await nameInput.fill(name);
  }

  if (description) {
    const descriptionInput = page.getByTestId("agent-description-input");
    await expect(descriptionInput).toBeVisible();
    await descriptionInput.fill(description);
  }

  await page.getByTestId("import-agent-submit").click();

  const importedRow = agentRow(page, name).first();
  await expect(importedRow).toBeVisible({ timeout: 30000 });
  return importedRow;
}

function possibleDeleteButtons(row) {
  const candidates = [
    row.getByTestId(/delete|trash/i),
    row.getByRole("button", { name: /delete|trash/i }),
    row.locator("button[aria-label*='Delete']"),
    row.locator("button[aria-label*='delete']"),
  ];
  return candidates;
}

export async function openDeleteDialog(page, name) {
  const row = agentRow(page, name).first();
  await expect(row).toBeVisible({ timeout: 20000 });

  const candidates = possibleDeleteButtons(row);
  let clicked = false;

  for (const locator of candidates) {
    if ((await locator.count()) > 0) {
      const button = locator.first();
      await button.scrollIntoViewIfNeeded();
      await button.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    throw new Error(`Delete button not found for agent ${name}`);
  }

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  return dialog;
}

export async function confirmDeletion(page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  const confirmButton = dialog.getByRole("button", { name: /yes,? delete/i });
  await expect(confirmButton).toBeEnabled({ timeout: 10000 });
  await confirmButton.click();
  await expect(dialog).toBeHidden({ timeout: 15000 });
}

export async function cancelDeletion(page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  const cancelButton = dialog.getByRole("button", { name: /cancel|no|dismiss/i });

  if ((await cancelButton.count()) > 0) {
    await cancelButton.first().click();
  } else {
    await page.keyboard.press("Escape");
  }

  await expect(dialog).toBeHidden({ timeout: 10000 });
}

export async function cancelWithEscape(page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden({ timeout: 10000 });
}

export async function waitForAgentRemoval(page, name) {
  const row = agentRow(page, name).first();
  await expect(row).toBeHidden({ timeout: 20000 });
}

export async function waitForAgentVisible(page, name) {
  const row = agentRow(page, name).first();
  await expect(row).toBeVisible({ timeout: 20000 });
  return row;
}

export async function reloadMonitor(page) {
  await page.reload({ waitUntil: "networkidle" });
  await gotoMonitor(page);
}

export function uniqueAgentName(prefix = "Delete Agent") {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "");
  return `${prefix} ${stamp}`;
}
