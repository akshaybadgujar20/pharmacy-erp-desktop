import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma.service';
import {
  ApiEnvelope,
  closeHttpTestApp,
  createHttpTestApp,
  loginAs,
  resetAllUserPasswords,
} from '../support/http-test.helpers';

describe('Financial year enforcement (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let branchId: string;
  let supplierId: string;
  let financialYearId: string;
  let financialYearVersion: string;
  let orderDate: string;
  let restoredStatus: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    prisma = app.get(PrismaService);
    await resetAllUserPasswords(prisma);

    adminToken = await loginAs(app, {
      username: 'admin',
      password: 'admin123',
    });

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const meBody = meResponse.body as ApiEnvelope<{ branchId: string }>;
    branchId = meBody.data?.branchId ?? '';

    const supplier = await prisma.client.supplier.findFirst({
      where: { deletedAt: null, isActive: true },
      orderBy: { id: 'asc' },
    });
    if (!supplier) {
      throw new Error('No active supplier in test database');
    }
    supplierId = supplier.id.toString();

    const fy = await prisma.client.financialYear.findFirst({
      where: { deletedAt: null, status: 'OPEN' },
      orderBy: { startDate: 'desc' },
    });
    if (!fy) {
      throw new Error('No open financial year in test database');
    }
    financialYearId = fy.id.toString();
    financialYearVersion = fy.version.toString();
    restoredStatus = fy.status;
    orderDate = fy.startDate.toString();
  });

  afterAll(async () => {
    await prisma.client.financialYear.update({
      where: { id: BigInt(financialYearId) },
      data: { status: restoredStatus },
    });
    await closeHttpTestApp(app);
  });

  it('POST /purchase-orders returns 409 FINANCIAL_YEAR_CLOSED when FY is closed', async () => {
    await request(app.getHttpServer())
      .post(`/financial-years/${financialYearId}/close`)
      .query({ version: financialYearVersion })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        branchId,
        supplierId,
        orderDate,
        remarks: 'FY_CLOSED_TEST',
      })
      .expect(409);

    const body = response.body as ApiEnvelope<unknown>;
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe('FINANCIAL_YEAR_CLOSED');
  });
});
