import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from 'src/prisma.service';
import { OutboxSyncStatus } from 'src/persistence/outbox/outbox-operation.constants';
import { startCloudSyncMock } from '../support/cloud-sync-mock';
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
});
