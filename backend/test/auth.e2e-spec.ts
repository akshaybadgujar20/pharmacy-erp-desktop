import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    const prisma = app.get(PrismaService);
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await prisma.client.user.updateMany({
      data: {
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  });

  afterEach(async () => {
    await app.close();
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
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);

    const loginBody = loginResponse.body as ApiEnvelope<{
      accessToken: string;
    }>;
    expect(loginBody.success).toBe(true);
    const accessToken = loginBody.data?.accessToken ?? '';

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
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'cashier1', password: 'admin123' })
      .expect(201);

    const loginBody = loginResponse.body as ApiEnvelope<{
      accessToken: string;
    }>;
    const accessToken = loginBody.data?.accessToken ?? '';

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
