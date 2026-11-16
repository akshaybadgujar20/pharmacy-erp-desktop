import { SyncCloudClient } from './sync-cloud.client';

describe('SyncCloudClient', () => {
  const previousUrl = process.env.SYNC_CLOUD_URL;

  afterEach(() => {
    process.env.SYNC_CLOUD_URL = previousUrl;
    jest.restoreAllMocks();
  });

  it('throws when SYNC_CLOUD_URL is missing', async () => {
    delete process.env.SYNC_CLOUD_URL;
    const client = new SyncCloudClient();
    await expect(
      client.pushBatch(
        { deviceId: 'd1' },
        { deviceId: 'd1', branchId: null, operations: [] },
      ),
    ).rejects.toMatchObject({ code: 'SYNC_CLOUD_URL_NOT_CONFIGURED' });
  });

  it('posts a batch to /push', async () => {
    process.env.SYNC_CLOUD_URL = 'http://cloud.test/api/sync';
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ results: [] })),
    } as Response);

    const client = new SyncCloudClient();
    await client.pushBatch(
      { deviceId: 'd1', authorization: 'Bearer tok' },
      { deviceId: 'd1', branchId: '1', operations: [] },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://cloud.test/api/sync/push',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer tok',
          'X-Device-Id': 'd1',
        }) as Record<string, string>,
      }),
    );
  });
});
