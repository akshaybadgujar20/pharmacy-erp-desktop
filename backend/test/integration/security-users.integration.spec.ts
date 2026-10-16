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

describe('Security users (integration)', () => {
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

  it('GET /users returns 401 without token', () => {
    return request(app.getHttpServer()).get('/users').expect(401);
  });

  it('GET /users returns paginated envelope with token', () => {
    return request(app.getHttpServer())
      .get('/users?page=1&pageSize=5')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
