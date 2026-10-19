import { request } from '@playwright/test';

const API = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000';
const USER = process.env.E2E_USERNAME ?? 'admin';
const PASS = process.env.E2E_PASSWORD ?? 'admin123';

async function globalSetup(): Promise<void> {
  const ctx = await request.newContext();
  const login = await ctx.post(`${API}/auth/login`, {
    data: { username: USER, password: PASS },
  });
  const loginBody = await login.json();
  const token = loginBody?.data?.accessToken as string | undefined;
  const branchId = loginBody?.data?.user?.branchId as string | undefined;
  if (!token || !branchId) {
    await ctx.dispose();
    return;
  }

  const invoice = await ctx.post(`${API}/sales-invoices`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      branchId,
      invoiceDate: String(Date.now()),
      salesType: 'RETAIL_OTC',
      remarks: 'PLAYWRIGHT_SMOKE_DRAFT',
    },
  });
  const invoiceBody = await invoice.json();
  const invoiceId = invoiceBody?.data?.id as string | undefined;
  if (invoiceId) {
    process.env.PLAYWRIGHT_DRAFT_INVOICE_ID = invoiceId;
  }
  await ctx.dispose();
}

export default globalSetup;
