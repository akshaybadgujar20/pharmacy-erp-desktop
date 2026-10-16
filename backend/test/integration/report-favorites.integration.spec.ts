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

describe('Report favorites (integration)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    await resetAllUserPasswords(app.get(PrismaService));
    adminToken = await loginAsAdmin(app);
  });

  afterAll(async () => closeHttpTestApp(app));

  it('GET /report-favorites returns 401 without token', () => {
    return request(app.getHttpServer()).get('/report-favorites').expect(401);
  });

  it('GET /report-favorites returns 403 without REPORTING permission', () => {
    return request(app.getHttpServer())
      .get('/report-favorites')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403);
  });
});
