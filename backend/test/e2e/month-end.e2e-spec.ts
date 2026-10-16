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

describe('Month-end (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createHttpTestApp();
    await resetAllUserPasswords(app.get(PrismaService));
  });

  afterAll(async () => closeHttpTestApp(app));

  it('GET /closing/pre-close-checklist returns blockers envelope', async () => {
    const token = await loginAsAdmin(app);
    const response = await request(app.getHttpServer())
      .get('/closing/pre-close-checklist')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = response.body as ApiEnvelope<{
      canClose: boolean;
      blockers: unknown[];
    }>;
    expect(body.success).toBe(true);
    expect(typeof body.data?.canClose).toBe('boolean');
    expect(Array.isArray(body.data?.blockers)).toBe(true);
  });
});
