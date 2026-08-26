import { AsyncLocalStorage } from 'async_hooks';
import { HttpStatus } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
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
    throw new ApplicationException(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'Request context is not initialized',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  return ctx;
}

export function tryGetRequestContext(): RequestContextData | undefined {
  return storage.getStore();
}
