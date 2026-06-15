import { test, expect } from '@playwright/test';
import { TEST_USER, API_URL } from './setup';

test.describe('Authentication', () => {
  test('register and login flow', async ({ page, request }) => {
    const reg = await request.post(`${API_URL}/auth/register`, { data: TEST_USER });
    expect(reg.ok()).toBeTruthy();

    const login = await request.post(`${API_URL}/auth/login`, {
      form: { username: TEST_USER.email, password: TEST_USER.password },
    });
    expect(login.ok()).toBeTruthy();
    const { access_token } = await login.json();
    expect(access_token).toBeTruthy();

    await page.goto('/login');
    await page.evaluate((t) => localStorage.setItem('token', t), access_token);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
    await page.context().storageState({ path: 'e2e/.auth/user.json' });
  });
});
