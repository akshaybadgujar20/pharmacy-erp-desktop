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

describe('Sales flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createHttpTestApp();
    await resetAllUserPasswords(app.get(PrismaService));
  });

  afterAll(async () => closeHttpTestApp(app));

  it('lists sales invoices and can load a draft when present', async () => {
    const token = await loginAsAdmin(app);
    const listResponse = await request(app.getHttpServer())
      .get('/sales-invoices?page=1&pageSize=5')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const listBody = listResponse.body as ApiEnvelope<
      { id: string; status: string }[]
    >;
    expect(listBody.success).toBe(true);
    const draft = listBody.data?.find((row) => row.status === 'DRAFT');
    if (!draft) {
      return;
    }

    await request(app.getHttpServer())
      .get(`/sales-invoices/${draft.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
