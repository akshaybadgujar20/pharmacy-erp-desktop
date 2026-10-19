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

  it('GET /reports returns 200 for admin with REPORT_VIEW', async () => {
    const response = await request(app.getHttpServer())
      .get('/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = response.body as ApiEnvelope<unknown[]>;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /reports/:id returns 200 for permitted sales report', async () => {
    await request(app.getHttpServer())
      .get('/reports/sales.daily-summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
