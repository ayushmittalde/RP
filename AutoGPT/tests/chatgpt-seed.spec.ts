import { test } from "@playwright/test";

test("Navigate to ChatGPT", async ({ page }) => {
  await page.goto("https://chatgpt.com/");
  await page.waitForLoadState("networkidle");
});
