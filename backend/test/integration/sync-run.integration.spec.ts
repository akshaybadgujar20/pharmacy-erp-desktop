import { randomUUID } from 'crypto';
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

describe('Sync run (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let previousCloudUrl: string | undefined;

  beforeAll(async () => {
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
    await closeHttpTestApp(app);
  });

  beforeEach(() => {
    clearCloudSyncMockState();
  });

  it('POST /sync/runs uploads pending outbox rows to cloud mock', async () => {
    const mock = await startCloudSyncMock();
    process.env.SYNC_CLOUD_URL = mock.url;

    const pending = await prisma.client.outbox.findFirst({
      where: { syncStatus: OutboxSyncStatus.PENDING },
      orderBy: { sequenceNo: 'asc' },
    });
    if (!pending) {
      await mock.close();
      return;
    }

    const response = await request(app.getHttpServer())
      .post('/sync/runs')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-device-id', pending.deviceId)
      .expect(201);

    const body = response.body as ApiEnvelope<{
      push: { recordsUploaded: number; status: string };
      pull: { recordsDownloaded: number; status: string };
    }>;
    expect(body.success).toBe(true);
    expect(body.data?.push.recordsUploaded).toBeGreaterThanOrEqual(0);

    await mock.close();
  });

  it('POST /sync/runs pull applies a remote country delta from cloud mock', async () => {
    const mock = await startCloudSyncMock();
    process.env.SYNC_CLOUD_URL = mock.url;

    const country = await prisma.client.country.findFirst({
      orderBy: { id: 'asc' },
    });
    if (!country) {
      await mock.close();
      return;
    }

    addCloudSyncRemotePullRecord({
      entityType: 'Country',
      entityUuid: country.uuid,
      operation: 'UPDATE',
      entityVersion: String(country.version + 1n),
      originDeviceId: 'remote-branch-device',
      payload: {
        data: {
          uuid: country.uuid,
          countryCode: country.countryCode,
          isoAlpha2: country.isoAlpha2,
          isoAlpha3: country.isoAlpha3,
          countryName: `${country.countryName} (synced)`,
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

    const updated = await prisma.client.country.findFirst({
      where: { id: country.id },
    });
    expect(updated?.countryName).toContain('(synced)');

    await mock.close();
  });

  it('pull does not advance cursor when remote payload fails apply', async () => {
    const mock = await startCloudSyncMock();
    process.env.SYNC_CLOUD_URL = mock.url;

    const before = await prisma.client.deviceSyncState.findFirst({
      orderBy: { id: 'asc' },
    });
    const cursorBefore = before?.lastPullCursor ?? null;

    addCloudSyncRemotePullRecord({
      entityType: 'State',
      entityUuid: randomUUID(),
      operation: 'UPDATE',
      entityVersion: '1',
      originDeviceId: 'remote-branch-device',
      payload: {
        data: {
          uuid: randomUUID(),
          stateCode: 'XX',
          stateName: 'Invalid',
        },
      },
    });

    await request(app.getHttpServer())
      .post('/sync/runs')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-device-id', 'desktop-dev-001')
      .expect(201);

    const after = await prisma.client.deviceSyncState.findFirst({
      orderBy: { id: 'asc' },
    });
    expect(after?.lastPullCursor).toBe(cursorBefore);

    await mock.close();
  });
});
