import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma.service';
import {
  ApiEnvelope,
  closeHttpTestApp,
  createHttpTestApp,
  loginAsAdmin,
  resetAllUserPasswords,
} from '../support/http-test.helpers';

describe('Purchase flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createHttpTestApp();
    await resetAllUserPasswords(app.get(PrismaService));
  });

  afterAll(async () => closeHttpTestApp(app));

  it('lists purchase orders and purchase invoices', async () => {
    const token = await loginAsAdmin(app);

    await request(app.getHttpServer())
      .get('/purchase-orders?page=1&pageSize=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const invoices = await request(app.getHttpServer())
      .get('/purchase-invoices?page=1&pageSize=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const body = invoices.body as ApiEnvelope<{ id: string }[]>;
    const first = body.data?.[0];
    if (first) {
      await request(app.getHttpServer())
        .get(`/purchase-invoices/${first.id}/match-summary`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    }
  });
});
