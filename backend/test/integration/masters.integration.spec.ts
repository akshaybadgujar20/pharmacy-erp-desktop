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

describe('Masters (integration)', () => {
  let app: INestApplication<App>;
  let adminToken: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    await resetAllUserPasswords(app.get(PrismaService));
    adminToken = await loginAsAdmin(app);
  });

  afterAll(async () => closeHttpTestApp(app));

  it('GET /countries returns 401 without token', () => {
    return request(app.getHttpServer()).get('/countries').expect(401);
  });

  it('GET /countries lists with token', () => {
    return request(app.getHttpServer())
      .get('/countries?page=1&pageSize=5')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => expect(res.body.success).toBe(true));
  });

  it('POST /masters/import dry-run rejects empty csv', () => {
    return request(app.getHttpServer())
      .post('/masters/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ entityType: 'country', csvText: '', dryRun: true })
      .expect(400);
  });
});
