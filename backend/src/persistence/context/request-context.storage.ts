import { AsyncLocalStorage } from 'async_hooks';
import type { RequestContextData } from './request-context';

const storage = new AsyncLocalStorage<RequestContextData>();

export function runWithRequestContext<T>(
  context: RequestContextData,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run(context, fn);
}

export function getRequestContext(): RequestContextData {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error('RequestContext is not set. Use runWithRequestContext() or RequestContextService.run().');
  }
  return ctx;
}

export function tryGetRequestContext(): RequestContextData | undefined {
  return storage.getStore();
}
