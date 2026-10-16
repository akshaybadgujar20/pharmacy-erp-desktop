import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma.service';
import {
  closeHttpTestApp,
  createHttpTestApp,
  loginAs,
  resetAllUserPasswords,
} from '../support/http-test.helpers';

describe('Sync run (e2e)', () => {
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

  it('POST /sync/runs returns 503 when SYNC_CLOUD_URL is unset', async () => {
    const previous = process.env.SYNC_CLOUD_URL;
    delete process.env.SYNC_CLOUD_URL;
    try {
      await request(app.getHttpServer())
        .post('/sync/runs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(503);
    } finally {
      process.env.SYNC_CLOUD_URL = previous;
    }
  });
});
