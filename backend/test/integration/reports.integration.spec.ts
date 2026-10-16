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

describe('Domain reports (integration)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    const prisma = app.get(PrismaService);
    await resetAllUserPasswords(prisma);
    adminToken = await loginAs(app, {
      username: 'admin',
      password: 'admin123',
    });
  });

  afterAll(async () => {
    await closeHttpTestApp(app);
  });

  const reportIds = [
    'sales.daily-summary',
    'purchase.po-status',
    'inventory.stock-on-hand',
    'finance.trial-balance',
  ];

  for (const reportId of reportIds) {
    it(`GET /reports/${reportId} returns 200 for admin`, async () => {
      const response = await request(app.getHttpServer())
        .get(`/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = response.body as ApiEnvelope<{ rows: unknown[] }>;
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data?.rows)).toBe(true);
    });
  }
});
