import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma.service';
import {
  closeHttpTestApp,
  createHttpTestApp,
  getSeededIds,
  loginAsAdmin,
  resetAllUserPasswords,
} from '../support/http-test.helpers';

describe('Inventory stocks (integration)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let medicineId: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    const prisma = app.get(PrismaService);
    await resetAllUserPasswords(prisma);
    adminToken = await loginAsAdmin(app);
    const ids = await getSeededIds(prisma);
    medicineId = ids.medicineId ?? '';
  });

  afterAll(async () => closeHttpTestApp(app));

  it('GET /stocks returns 401 without token', () => {
    return request(app.getHttpServer()).get('/stocks').expect(401);
  });

  it('GET /inventory/fefo-preview requires medicineId', () => {
    return request(app.getHttpServer())
      .get('/inventory/fefo-preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
  });

  it('GET /inventory/fefo-preview returns rows when medicineId set', async () => {
    if (!medicineId) {
      return;
    }
    await request(app.getHttpServer())
      .get(`/inventory/fefo-preview?medicineId=${medicineId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
