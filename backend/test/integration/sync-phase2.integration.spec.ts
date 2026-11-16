import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma.service';
import { OutboxSyncStatus } from 'src/persistence/outbox/outbox-operation.constants';
import {
  addCloudSyncRemotePullRecord,
  clearCloudSyncMockState,
  startCloudSyncMock,
} from '../support/cloud-sync-mock';
import {
  ApiEnvelope,
  closeHttpTestApp,
  createHttpTestApp,
  loginAs,
  resetAllUserPasswords,
} from '../support/http-test.helpers';

describe('Sync phase 2 (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let previousCloudUrl: string | undefined;
  let previousPhase2: string | undefined;

  beforeAll(async () => {
    previousPhase2 = process.env.SYNC_PHASE2_ENABLED;
    process.env.SYNC_PHASE2_ENABLED = 'true';
    app = await createHttpTestApp();
    prisma = app.get(PrismaService);
    await resetAllUserPasswords(prisma);
    adminToken = await loginAs(app, {
      username: 'admin',
      password: 'admin123',
    });
    previousCloudUrl = process.env.SYNC_CLOUD_URL;
  });

  afterAll(async () => {
    process.env.SYNC_CLOUD_URL = previousCloudUrl;
    process.env.SYNC_PHASE2_ENABLED = previousPhase2;
    await closeHttpTestApp(app);
  });

  beforeEach(() => {
    clearCloudSyncMockState();
  });

  it('pull applies a remote Tax record when phase2 is enabled', async () => {
    const mock = await startCloudSyncMock();
    process.env.SYNC_CLOUD_URL = mock.url;

    const tax = await prisma.client.tax.findFirst({ orderBy: { id: 'asc' } });
    if (!tax) {
      await mock.close();
      return;
    }

    const remoteName = `${tax.taxName} (cloud)`;
    addCloudSyncRemotePullRecord({
      entityType: 'Tax',
      entityUuid: tax.uuid,
      operation: 'UPDATE',
      entityVersion: String(tax.version + 1n),
      originDeviceId: 'remote-branch-device',
      payload: {
        data: {
          uuid: tax.uuid,
          taxCode: tax.taxCode,
          taxName: remoteName,
          taxType: tax.taxType,
          taxRate: tax.taxRate.toString(),
          effectiveFrom: tax.effectiveFrom.toString(),
          effectiveTo: tax.effectiveTo?.toString() ?? null,
          isActive: true,
        },
      },
    });

    const pending = await prisma.client.outbox.findFirst({
      where: { syncStatus: OutboxSyncStatus.PENDING },
      orderBy: { sequenceNo: 'asc' },
    });
    const deviceId = pending?.deviceId ?? 'desktop-dev-001';

    const response = await request(app.getHttpServer())
      .post('/sync/runs')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-device-id', deviceId)
      .expect(201);

    const body = response.body as ApiEnvelope<{
      pull: { recordsDownloaded: number; status: string };
    }>;
    expect(body.success).toBe(true);
    expect(body.data?.pull.recordsDownloaded).toBeGreaterThanOrEqual(1);

    const updated = await prisma.client.tax.findFirst({
      where: { uuid: tax.uuid },
    });
    expect(updated?.taxName).toBe(remoteName);

    await mock.close();
  });
});
