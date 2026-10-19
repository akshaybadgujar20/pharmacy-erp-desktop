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

describe('Party customers (integration)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    await resetAllUserPasswords(app.get(PrismaService));
    token = await loginAsAdmin(app);
  });

  afterAll(async () => closeHttpTestApp(app));

  it('GET /customers returns 401 without token', () => {
    return request(app.getHttpServer())
      .get('/customers?page=1&pageSize=5')
      .expect(401);
  });

  it('GET /customers lists seeded customers', async () => {
    const response = await request(app.getHttpServer())
      .get('/customers?page=1&pageSize=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as ApiEnvelope<unknown[]>;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
