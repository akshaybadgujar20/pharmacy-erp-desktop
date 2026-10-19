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

describe('Closing (integration)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    await resetAllUserPasswords(app.get(PrismaService));
    token = await loginAsAdmin(app);
  });

  afterAll(async () => closeHttpTestApp(app));

  it('GET /closing/pre-close-checklist returns 401 without token', () => {
    return request(app.getHttpServer())
      .get('/closing/pre-close-checklist')
      .expect(401);
  });

  it('GET /closing/pre-close-checklist returns checklist', async () => {
    const response = await request(app.getHttpServer())
      .get('/closing/pre-close-checklist')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as ApiEnvelope<{ canClose: boolean }>;
    expect(body.success).toBe(true);
    expect(typeof body.data?.canClose).toBe('boolean');
  });
});
