import http from 'node:http';
import type { SyncCloudPullRecord } from 'src/sync/cloud/sync-cloud.contract';

interface PushBody {
  deviceId?: string;
  branchId?: string | null;
  operations?: Array<{
    operationId: string;
    entityType: string;
    entityUuid: string;
    operation: string;
    entityVersion: string;
    sequenceNo: string;
    payload: unknown;
  }>;
}

const appliedOperationIds = new Set<string>();
const changeLog: Array<{
  cursor: string;
  originDeviceId: string;
  record: SyncCloudPullRecord;
}> = [];
const remotePullRecords: SyncCloudPullRecord[] = [];

let cursorSeq = 0;

function nextCursor(): string {
  cursorSeq += 1;
  return `cursor-${cursorSeq}`;
}

export function clearCloudSyncMockState(): void {
  appliedOperationIds.clear();
  changeLog.length = 0;
  remotePullRecords.length = 0;
  cursorSeq = 0;
}

export function addCloudSyncRemotePullRecord(
  record: SyncCloudPullRecord,
): void {
  remotePullRecords.push(record);
}

export async function startCloudSyncMock(): Promise<{
  url: string;
  receivedPushBodies: PushBody[];
  close: () => Promise<void>;
}> {
  const receivedPushBodies: PushBody[] = [];

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const pathname = url.pathname.replace(/\/$/, '');

    if (req.method === 'POST' && pathname.endsWith('/push')) {
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        let body: PushBody = {};
        try {
          body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as PushBody;
        } catch {
          body = {};
        }
        receivedPushBodies.push(body);

        const deviceId = body.deviceId ?? 'unknown';
        const operations = Array.isArray(body.operations)
          ? body.operations
          : [];
        const results = operations.map((op) => {
          if (appliedOperationIds.has(op.operationId)) {
            return {
              operationId: op.operationId,
              status: 'DUPLICATE',
              serverEntityVersion: op.entityVersion,
              serverPayload: null,
            };
          }
          appliedOperationIds.add(op.operationId);
          const serverVersion = String(
            Number.parseInt(op.entityVersion, 10) + 1 || 2,
          );
          changeLog.push({
            cursor: nextCursor(),
            originDeviceId: deviceId,
            record: {
              entityType: op.entityType,
              entityUuid: op.entityUuid,
              operation: op.operation,
              entityVersion: serverVersion,
              originDeviceId: deviceId,
              payload: { data: op.payload },
            },
          });
          return {
            operationId: op.operationId,
            status: 'ACCEPTED',
            serverEntityVersion: serverVersion,
            serverPayload: null,
          };
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ results }));
      });
      return;
    }

    if (req.method === 'GET' && pathname.endsWith('/pull')) {
      const deviceId = url.searchParams.get('deviceId') ?? '';
      const cursor = url.searchParams.get('cursor');
      const limit = Math.min(
        Math.max(Number.parseInt(url.searchParams.get('limit') ?? '50', 10), 1),
        200,
      );

      const merged = [
        ...remotePullRecords.map((record) => ({
          cursor: nextCursor(),
          originDeviceId: record.originDeviceId ?? 'remote-device',
          record,
        })),
        ...changeLog,
      ];

      let startIndex = 0;
      if (cursor) {
        const idx = merged.findIndex((entry) => entry.cursor === cursor);
        startIndex = idx >= 0 ? idx + 1 : 0;
      }

      const slice = merged.slice(startIndex, startIndex + limit);
      const records = slice.map((entry) => entry.record);
      const next =
        startIndex + limit < merged.length
          ? (slice[slice.length - 1]?.cursor ?? null)
          : null;
      const hasMore = startIndex + limit < merged.length;

      void deviceId;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          records,
          nextCursor: hasMore ? next : (merged.at(-1)?.cursor ?? null),
          hasMore,
        }),
      );
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(0, '127.0.0.1', (err?: Error) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind cloud sync mock');
  }

  return {
    url: `http://127.0.0.1:${address.port}/api/sync`,
    receivedPushBodies,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
