import http from 'node:http';

export async function startCloudSyncMock(): Promise<{
  url: string;
  received: unknown[];
  close: () => Promise<void>;
}> {
  const received: unknown[] = [];
  const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => {
        try {
          received.push(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch {
          received.push(null);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
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
    url: `http://127.0.0.1:${address.port}/sync`,
    received,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
