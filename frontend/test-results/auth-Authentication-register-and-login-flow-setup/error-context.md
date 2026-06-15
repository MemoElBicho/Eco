# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> register and login flow
- Location: e2e\auth.spec.ts:5:7

# Error details

```
Error: Register failed: {"detail":"Internal server error"}

expect(received).toBe(expected) // Object.is equality

Expected: 201
Received: 500
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { TEST_USER, API_URL } from './setup';
  3  | 
  4  | test.describe('Authentication', () => {
  5  |   test('register and login flow', async ({ page, request }) => {
  6  |     test.setTimeout(120_000);
  7  |     const reg = await request.post(`${API_URL}/auth/register`, { data: TEST_USER });
> 8  |     expect(reg.status(), `Register failed: ${await reg.text()}`).toBe(201);
     |                                                                  ^ Error: Register failed: {"detail":"Internal server error"}
  9  | 
  10 |     const login = await request.post(`${API_URL}/auth/login`, {
  11 |       form: { username: TEST_USER.email, password: TEST_USER.password },
  12 |     });
  13 |     expect(login.status(), `Login failed: ${await login.text()}`).toBe(200);
  14 |     const { access_token } = await login.json();
  15 |     expect(access_token).toBeTruthy();
  16 | 
  17 |     await page.goto('/login');
  18 |     await page.evaluate((t) => localStorage.setItem('token', t), access_token);
  19 |     await page.goto('/');
  20 | 
  21 |     await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
  22 |     await page.context().storageState({ path: 'e2e/.auth/user.json' });
  23 |   });
  24 | });
  25 | 
```