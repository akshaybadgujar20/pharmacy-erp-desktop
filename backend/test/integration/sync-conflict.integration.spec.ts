import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma.service';
import {
  closeHttpTestApp,
  createHttpTestApp,
  loginAsAdmin,
  resetAllUserPasswords,
} from '../support/http-test.helpers';

describe('Sync conflicts (integration)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    const prisma = app.get(PrismaService);
    await resetAllUserPasswords(prisma);
    adminToken = await loginAsAdmin(app);
  });

  afterAll(async () => {
    await closeHttpTestApp(app);
  });

  it('GET /sync-conflicts returns 401 without token', () => {
    return request(app.getHttpServer()).get('/sync-conflicts').expect(401);
  });

  it('GET /sync-conflicts returns paginated list for admin', async () => {
    await request(app.getHttpServer())
      .get('/sync-conflicts?page=1&pageSize=5')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
