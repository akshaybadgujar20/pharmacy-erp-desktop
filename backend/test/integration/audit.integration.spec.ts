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

describe('Audit (integration)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    await resetAllUserPasswords(app.get(PrismaService));
    adminToken = await loginAsAdmin(app);
  });

  afterAll(async () => closeHttpTestApp(app));

  it('GET /audit-logs returns 401 without token', () => {
    return request(app.getHttpServer()).get('/audit-logs').expect(401);
  });

  it('GET /audit-logs lists with token', () => {
    return request(app.getHttpServer())
      .get('/audit-logs?page=1&pageSize=5')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
