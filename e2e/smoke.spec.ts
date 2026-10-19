import { expect, test } from '@playwright/test';

const username = process.env.E2E_USERNAME ?? 'admin';
const password = process.env.E2E_PASSWORD ?? 'admin123';

test.describe('UI smoke', () => {
  test('login lands on dashboard shell', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('counter opens for draft invoice', async ({ page, request }) => {
    const loginRes = await request.post('http://127.0.0.1:3000/auth/login', {
      data: { username, password },
    });
    const loginJson = await loginRes.json();
    const token = loginJson?.data?.accessToken as string;
    const branchId = loginJson?.data?.user?.branchId as string;
    expect(token).toBeTruthy();

    const createRes = await request.post('http://127.0.0.1:3000/sales-invoices', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        branchId,
        invoiceDate: String(Date.now()),
        salesType: 'RETAIL_OTC',
      },
    });
    const createJson = await createRes.json();
    const invoiceId = createJson?.data?.id as string;
    expect(invoiceId).toBeTruthy();

    await page.goto('/login');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.goto(`/sales/invoices/${invoiceId}/counter`);
    await expect(page.getByRole('heading', { name: /counter sale/i })).toBeVisible();
  });

  test('GRN wizard lists purchase orders', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.goto('/purchase/grn-wizard');
    await expect(page.getByRole('heading', { name: /PO to GRN wizard/i })).toBeVisible();
  });

  test('month-end checklist controls visible', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.goto('/finance/month-end-close');
    await page.getByRole('button', { name: /load pre-close checklist/i }).click();
    await expect(page.getByTestId('month-end-can-close')).toBeVisible();
  });

  test('sync dashboard loads', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.goto('/sync');
    await expect(page).toHaveURL(/sync/);
  });
});
