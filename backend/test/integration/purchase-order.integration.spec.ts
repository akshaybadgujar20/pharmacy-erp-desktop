import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma.service';
import {
  ApiEnvelope,
  closeHttpTestApp,
  createHttpTestApp,
  loginAs,
  resetAllUserPasswords,
} from '../support/http-test.helpers';

const TEST_MARKER = 'INT_PURCHASE_PO';

async function deleteMarkerPurchaseOrders(
  prisma: PrismaService,
): Promise<void> {
  const orders = await prisma.client.purchaseOrder.findMany({
    where: { remarks: { contains: TEST_MARKER } },
    select: { id: true },
  });
  for (const order of orders) {
    await prisma.client.purchaseOrderItem.deleteMany({
      where: { purchaseOrderId: order.id },
    });
  }
  await prisma.client.purchaseOrder.deleteMany({
    where: { remarks: { contains: TEST_MARKER } },
  });
}

describe('Purchase orders (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let branchId: string;
  let supplierId: string;

  beforeAll(async () => {
    app = await createHttpTestApp();
    prisma = app.get(PrismaService);
    await resetAllUserPasswords(prisma);
    await deleteMarkerPurchaseOrders(prisma);

    adminToken = await loginAs(app, {
      username: 'admin',
      password: 'admin123',
    });

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const meBody = meResponse.body as ApiEnvelope<{ branchId: string }>;
    branchId = meBody.data?.branchId ?? '';

    const supplier = await prisma.client.supplier.findFirst({
      where: { deletedAt: null, isActive: true },
      orderBy: { id: 'asc' },
    });
    if (!supplier) {
      throw new Error('No active supplier in test database');
    }
    supplierId = supplier.id.toString();
  });

  afterAll(async () => {
    await deleteMarkerPurchaseOrders(prisma);
    await closeHttpTestApp(app);
  });

  it('GET /purchase-orders/:id returns 401 without token', () => {
    return request(app.getHttpServer()).get('/purchase-orders/1').expect(401);
  });

  it('POST /purchase-orders returns 400 when body is invalid', () => {
    return request(app.getHttpServer())
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(400)
      .expect((res) => {
        const body = res.body as ApiEnvelope<unknown>;
        expect(body.success).toBe(false);
      });
  });

  it('GET /purchase-orders/:id returns 404 for unknown id', () => {
    return request(app.getHttpServer())
      .get('/purchase-orders/999999999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404)
      .expect((res) => {
        const body = res.body as ApiEnvelope<unknown>;
        expect(body.error?.code).toBe('PURCHASE_ORDER_NOT_FOUND');
      });
  });

  it('POST /purchase-orders returns 403 for cashier without create permission', async () => {
    const cashierToken = await loginAs(app, {
      username: 'cashier1',
      password: 'admin123',
    });

    await request(app.getHttpServer())
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        branchId,
        supplierId,
        orderDate: Date.now().toString(),
        remarks: `${TEST_MARKER} denied`,
      })
      .expect(403)
      .expect((res) => {
        const body = res.body as ApiEnvelope<unknown>;
        expect(body.error?.code).toBe('AUTH_PERMISSION_DENIED');
      });
  });

  it('CRUD lifecycle for purchase order header', async () => {
    const orderDate = Date.now().toString();

    const createRes = await request(app.getHttpServer())
      .post('/purchase-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        branchId,
        supplierId,
        orderDate,
        remarks: `${TEST_MARKER} lifecycle`,
      })
      .expect(201);

    const createBody = createRes.body as ApiEnvelope<{
      id: string;
      version: string;
      remarks: string;
    }>;
    expect(createBody.success).toBe(true);
    const orderId = createBody.data?.id ?? '';
    const version = createBody.data?.version ?? '1';
    expect(createBody.data?.remarks).toContain(TEST_MARKER);

    await request(app.getHttpServer())
      .get(`/purchase-orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as ApiEnvelope<{ id: string }>;
        expect(body.data?.id).toBe(orderId);
      });

    const updateRes = await request(app.getHttpServer())
      .patch(`/purchase-orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        version,
        remarks: `${TEST_MARKER} lifecycle updated`,
      })
      .expect(200);

    const updateBody = updateRes.body as ApiEnvelope<{ version: string }>;
    const updatedVersion = updateBody.data?.version ?? version;

    await request(app.getHttpServer())
      .delete(`/purchase-orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ version: updatedVersion })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/purchase-orders/${orderId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });
});
