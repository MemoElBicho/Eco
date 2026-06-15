import { test, expect } from '@playwright/test';

test.describe('Conversations & Live Chat', () => {
  test('send manual message and toggle bot', async ({ page }) => {
    await page.goto('/conversations');
    await expect(page.getByText('Live Chats')).toBeVisible();

    const chatListArea = page.locator('.flex.w-80');
    const chatItem = chatListArea.locator('button').first();
    if ((await chatItem.count()) === 0) {
      test.skip(true, 'No conversations available');
      return;
    }
    await chatItem.click();
    await expect(page.getByPlaceholder('Type a message...')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Type a message...').fill('E2E manual reply');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    const botBtn = page.getByRole('button', { name: /Pause AI|Resume AI/ });
    const before = await botBtn.textContent();
    await botBtn.click();
    await page.waitForTimeout(1000);
    expect(await botBtn.textContent()).not.toBe(before);
  });
});
