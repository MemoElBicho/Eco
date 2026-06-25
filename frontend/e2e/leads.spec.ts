import { test, expect } from '@playwright/test';
import { API_URL } from './setup';

test.describe('CRM Leads', () => {
  test('create and delete a lead', async ({ page, request }) => {
    await page.goto('/leads');
    await expect(page.locator('button').filter({ hasText: 'Add Lead' })).toBeVisible({ timeout: 5000 });

    const token = await page.evaluate(() => localStorage.getItem('token'));
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const createRes = await request.post(`${API_URL}/leads/`, {
      data: { name: 'E2E Lead', phone: '555000111', channel: 'whatsapp', channel_user_id: 'e2e_test' },
      headers,
    });
    expect(createRes.ok(), `Create lead failed: ${await createRes.text()}`).toBeTruthy();
    const { id } = await createRes.json();

    await page.reload();
    await expect(page.getByText('E2E Lead')).toBeVisible();

    await request.delete(`${API_URL}/leads/${id}`, { headers });

    await page.reload();
    await expect(page.getByText('E2E Lead')).toHaveCount(0);
  });
});
