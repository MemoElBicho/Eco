import { test, expect } from '@playwright/test';

test.describe('Echo Brain', () => {
  test.fixme('upload document and verify listing', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto('/brain');
    await expect(page.getByText('Upload Document')).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'knowledge.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Echo knowledge base test content for E2E.'),
    });

    await page.getByRole('button', { name: 'Upload' }).click();

    await expect(page.locator('text=Processing...')).toBeVisible();
    await expect(page.locator('text=Processing...')).not.toBeVisible({ timeout: 15000 });

    await expect(page.getByText('knowledge.txt')).toBeVisible({ timeout: 10000 });
  });
});
