import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("home page renders primary actions", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Upload a document" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try demo document" })).toBeVisible();
});

test("home page has no critical axe violations @a11y", async ({ page }) => {
  await page.goto("/");

  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
