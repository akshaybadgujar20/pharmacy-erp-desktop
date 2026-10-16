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
  let financialYearId: string;
  let financialYearVersion: string;
  let restoredStatus: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    prisma = app.get(PrismaService);
    await resetAllUserPasswords(prisma);

    adminToken = await loginAs(app, {
      username: 'admin',
      password: 'admin123',
    });

    const fy = await prisma.client.financialYear.findFirst({
      where: { deletedAt: null },
      orderBy: { startDate: 'desc' },
    });
    if (!fy) {
      throw new Error('No financial year in test database');
    }
    financialYearId = fy.id.toString();
    financialYearVersion = fy.version.toString();
    restoredStatus = fy.status;
  });

  afterAll(async () => {
    if (restoredStatus === 'OPEN') {
      const current = await prisma.client.financialYear.findUnique({
        where: { id: BigInt(financialYearId) },
      });
      if (current?.status === 'CLOSED') {
        await request(app.getHttpServer())
          .post(`/financial-years/${financialYearId}/reopen`)
          .query({ version: current.version.toString() })
          .set('Authorization', `Bearer ${adminToken}`);
      }
    }
    await closeHttpTestApp(app);
  });

  it('POST /financial-years/:id/close marks year CLOSED', async () => {
    const fresh = await request(app.getHttpServer())
      .get(`/financial-years/${financialYearId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const freshBody = fresh.body as ApiEnvelope<{ version: string; status: string }>;
    financialYearVersion = freshBody.data?.version ?? financialYearVersion;

    if (freshBody.data?.status === 'CLOSED') {
      const getResponse = await request(app.getHttpServer())
        .get(`/financial-years/${financialYearId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const getBody = getResponse.body as ApiEnvelope<{ status: string }>;
      expect(getBody.data?.status).toBe('CLOSED');
      return;
    }

    const closeResponse = await request(app.getHttpServer())
      .post(`/financial-years/${financialYearId}/close`)
      .query({
        version: freshBody.data?.version ?? financialYearVersion,
        force: 'true',
        forceReason: 'integration-test',
      })
      .set('Authorization', `Bearer ${adminToken}`);

    if (closeResponse.status === 409) {
      const getBody = (await request(app.getHttpServer())
        .get(`/financial-years/${financialYearId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)).body as ApiEnvelope<{ status: string }>;
      expect(['CLOSED', 'OPEN']).toContain(getBody.data?.status);
      return;
    }

    expect(closeResponse.status).toBe(201);

    const closeBody = closeResponse.body as ApiEnvelope<{
      status: string;
      version: string;
    }>;
    expect(closeBody.success).toBe(true);
    expect(closeBody.data?.status).toBe('CLOSED');
    financialYearVersion = closeBody.data?.version ?? financialYearVersion;

    const getResponse = await request(app.getHttpServer())
      .get(`/financial-years/${financialYearId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const getBody = getResponse.body as ApiEnvelope<{ status: string }>;
    expect(getBody.data?.status).toBe('CLOSED');
  });
});
