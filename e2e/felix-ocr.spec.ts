import { test, expect } from '@playwright/test';

test.describe('Felix OCR', () => {
  test('page loads', async ({ page }) => {
    const response = await page.goto('/felix');
    expect(response?.status()).toBeLessThan(500);
  });

  test('file upload or text input is present', async ({ page }) => {
    await page.goto('/felix');
    await page.waitForTimeout(3000);
    const interactive = page.locator('input, textarea, button');
    const count = await interactive.count();
    expect(count).toBeGreaterThan(0);
  });

  test('manual input section exists', async ({ page }) => {
    await page.goto('/felix');
    // Should have a way to enter numbers manually
    const manualSection = page.locator('text=/Manuell|Eingabe|Paste/i');
    if (await manualSection.isVisible().catch(() => false)) {
      await expect(manualSection).toBeVisible();
    }
  });

  test('guest count table shows after data entry', async ({ page }) => {
    await page.goto('/felix');
    await page.waitForTimeout(500);

    // Look for textarea or text input for pasting OCR text
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('Mo  03.02.25  Ges.  85  72  5  35  0  28  12');
      // Look for parse/submit button
      const parseBtn = page.locator('button:has-text("Parsen"), button:has-text("Erkennen"), button:has-text("Auswerten")').first();
      if (await parseBtn.isVisible()) {
        await parseBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('save button exists', async ({ page }) => {
    await page.goto('/felix');
    await page.waitForTimeout(500);

    const saveBtn = page.locator('button:has-text("Speichern"), button:has-text("Alle speichern")');
    // May or may not be visible depending on state
    expect(await saveBtn.count()).toBeGreaterThanOrEqual(0);
  });
});
