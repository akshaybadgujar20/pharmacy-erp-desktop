import { AsyncLocalStorage } from 'async_hooks';
import type { TxClient } from './prisma-tx.type';

const storage = new AsyncLocalStorage<TxClient>();

export function runWithPrismaTransactionContext<T>(
  tx: TxClient,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(tx, fn);
}

export function tryGetActivePrismaTransactionClient(): TxClient | undefined {
  return storage.getStore();
}
