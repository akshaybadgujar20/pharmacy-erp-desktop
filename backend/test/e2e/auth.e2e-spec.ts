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

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeEach(async () => {
    app = await createHttpTestApp();
    prisma = app.get(PrismaService);
    await resetAllUserPasswords(prisma);
  });

  afterEach(async () => {
    await closeHttpTestApp(app);
  });

  it('POST /auth/login rejects invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrong-password' })
      .expect(401)
      .expect((res) => {
        const body = res.body as ApiEnvelope<unknown>;
        expect(body.success).toBe(false);
        expect(body.error?.code).toBe('AUTH_INVALID_CREDENTIALS');
      });
  });

  it('GET /auth/me returns 401 without token', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('login → authorized /auth/me → logout flow', async () => {
    const accessToken = await loginAs(app, {
      username: 'admin',
      password: 'admin123',
    });

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as ApiEnvelope<{ username: string }>;
        expect(body.success).toBe(true);
        expect(body.data?.username).toBe('admin');
      });

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
  });

  it('GET /settings returns 403 for cashier without settings permission', async () => {
    const accessToken = await loginAs(app, {
      username: 'cashier1',
      password: 'admin123',
    });

    await request(app.getHttpServer())
      .get('/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403)
      .expect((res) => {
        const body = res.body as ApiEnvelope<unknown>;
        expect(body.error?.code).toBe('AUTH_PERMISSION_DENIED');
      });
  });
});
