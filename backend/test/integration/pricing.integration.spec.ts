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

describe('Pricing (integration)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    await resetAllUserPasswords(app.get(PrismaService));
    token = await loginAsAdmin(app);
  });

  afterAll(async () => closeHttpTestApp(app));

  it('GET /price-lists returns 401 without token', () => {
    return request(app.getHttpServer()).get('/price-lists?page=1').expect(401);
  });

  it('GET /price-lists returns envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/price-lists?page=1&pageSize=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as ApiEnvelope<unknown[]>;
    expect(body.success).toBe(true);
  });
});
