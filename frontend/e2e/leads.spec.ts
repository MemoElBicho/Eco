import { test, expect } from '@playwright/test';

test.describe('CRM Leads', () => {
  test('create and delete a lead', async ({ page }) => {
    await page.goto('/leads');
    await expect(page.getByText('CRM Leads')).toBeVisible();

    await page.getByRole('button', { name: 'Add Lead' }).click();
    await expect(page.getByRole('heading', { name: 'New Lead' })).toBeVisible();

    await page.getByPlaceholder('John Doe').fill('E2E Lead');
    await page.getByPlaceholder('123456789').fill('555000111');

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('E2E Lead')).toBeVisible();

    const row = page.locator('tr', { hasText: 'E2E Lead' });
    await row.getByRole('button').click();
    await expect(page.getByText('E2E Lead')).toHaveCount(0);
  });
});
