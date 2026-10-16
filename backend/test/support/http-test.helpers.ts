import { ValidationPipe } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma.service';
import type { ApiEnvelope } from './api-envelope.types';

export type { ApiEnvelope } from './api-envelope.types';

export async function createHttpTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();
  return app;
}

export async function closeHttpTestApp(
  app: INestApplication<App> | undefined,
): Promise<void> {
  if (app) {
    await app.close();
  }
}

export async function resetAllUserPasswords(
  prisma: PrismaService,
  password = 'admin123',
): Promise<void> {
  const passwordHash = bcrypt.hashSync(password, 10);
  await prisma.client.user.updateMany({
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

export async function loginAs(
  app: INestApplication<App>,
  credentials: { username: string; password: string },
): Promise<string> {
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send(credentials)
    .expect(201);

  const loginBody = loginResponse.body as ApiEnvelope<{ accessToken: string }>;
  const accessToken = loginBody.data?.accessToken ?? '';
  if (!accessToken) {
    throw new Error(`Login failed for user ${credentials.username}`);
  }
  return accessToken;
}
