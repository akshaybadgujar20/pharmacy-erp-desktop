import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma.service';
import {
  ApiEnvelope,
  closeHttpTestApp,
  createHttpTestApp,
  loginAsAdmin,
  resetAllUserPasswords,
} from '../support/http-test.helpers';

describe('Purchase invoices (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    prisma = app.get(PrismaService);
    await resetAllUserPasswords(prisma);
    adminToken = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await closeHttpTestApp(app);
  });

  it('GET /purchase-invoices/:id/match-summary returns 401 without token', () => {
    return request(app.getHttpServer())
      .get('/purchase-invoices/1/match-summary')
      .expect(401);
  });

  it('GET /purchase-invoices/:id/match-summary returns envelope for seeded invoice', async () => {
    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const meBody = meResponse.body as ApiEnvelope<{ branchId: string }>;
    const branchId = meBody.data?.branchId;
    if (!branchId) {
      return;
    }

    const invoice = await prisma.client.purchaseInvoice.findFirst({
      where: { deletedAt: null, branchId: BigInt(branchId) },
      orderBy: { id: 'asc' },
    });
    if (!invoice) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get(`/purchase-invoices/${invoice.id}/match-summary`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = response.body as ApiEnvelope<{
      matchStatus: string;
      purchaseInvoiceId: string;
    }>;
    expect(body.success).toBe(true);
    expect(body.data?.purchaseInvoiceId).toBe(invoice.id.toString());
    expect(body.data?.matchStatus).toBeDefined();
  });
});
