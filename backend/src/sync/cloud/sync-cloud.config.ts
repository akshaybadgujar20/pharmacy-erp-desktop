export function getSyncCloudBaseUrl(): string | undefined {
  const url = process.env.SYNC_CLOUD_URL?.trim();
  return url || undefined;
}

export function getSyncBatchSize(): number {
  return Math.min(
    Math.max(parseInt(process.env.SYNC_BATCH_SIZE ?? '50', 10), 1),
    200,
  );
}

export function getSyncPullPageLimit(): number {
  return Math.min(
    Math.max(parseInt(process.env.SYNC_PULL_LIMIT ?? '50', 10), 1),
    200,
  );
}

export function getSyncMaxPullPages(): number {
  return Math.min(
    Math.max(parseInt(process.env.SYNC_MAX_PULL_PAGES ?? '10', 10), 1),
    50,
  );
}

export function getSyncRequestTimeoutMs(): number {
  return Math.min(
    Math.max(
      parseInt(process.env.SYNC_REQUEST_TIMEOUT_MS ?? '30000', 10),
      1000,
    ),
    120000,
  );
}
