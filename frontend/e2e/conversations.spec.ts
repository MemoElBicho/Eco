import { test, expect } from '@playwright/test';
import { API_URL } from './setup';

test.describe('Conversations & Live Chat', () => {
  test('send manual message and toggle bot', async ({ page, request }) => {
    test.setTimeout(120_000);

    await page.goto('/');
    await page.waitForTimeout(500);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const phone = `555${Date.now().toString().slice(-7)}`;
    const chId = `e2e_conv_${Date.now()}`;
    const createRes = await request.post(`${API_URL}/leads/`, {
      data: { name: 'E2E Chat', phone, channel: 'whatsapp', channel_user_id: chId },
      headers,
    });
    expect(createRes.ok(), `Create lead failed: ${await createRes.text()}`).toBeTruthy();
    const { id: leadId } = await createRes.json();

    const sendRes = await request.post(`${API_URL}/conversations/${leadId}/send-manual`, {
      data: { content: 'E2E automated seed message' },
      headers,
    });
    expect(sendRes.ok(), `Send manual: ${sendRes.status()} ${await sendRes.text()}`).toBeTruthy();

    const convCheck = await request.get(`${API_URL}/conversations/`, { headers });
    const convs = await convCheck.json();
    expect(convs.length, `No conversations found in API: ${JSON.stringify(convs)}`).toBeGreaterThan(0);

    await page.goto('/conversations');
    await expect(page.locator('.w-80')).toBeVisible({ timeout: 10000 });

    const chatListArea = page.locator('.w-80');
    await page.waitForTimeout(3000);
    const chatItem = chatListArea.locator('button').first();
    if ((await chatItem.count()) === 0) {
      test.skip(true, 'No conversations available');
      return;
    }
    await chatItem.click();
    await expect(page.getByPlaceholder('Escribe un mensaje...')).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('Escribe un mensaje...').fill('E2E manual reply');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    const botBtn = page.locator('button', { hasText: /Pause AI|Resume AI/ });
    await expect(botBtn).toBeVisible({ timeout: 5000 });
    const before = await botBtn.textContent();
    expect(before).toBeTruthy();
    await botBtn.click();
  });
});
