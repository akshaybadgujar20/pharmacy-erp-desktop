import { Injectable } from '@nestjs/common';
import type { RequestContextData } from './request-context';
import { getRequestContext, runWithRequestContext, tryGetRequestContext } from './request-context.storage';

@Injectable()
export class RequestContextService {
  run<T>(context: RequestContextData, fn: () => T | Promise<T>): T | Promise<T> {
    return runWithRequestContext(context, fn);
  }

  get(): RequestContextData {
    return getRequestContext();
  }

  tryGet(): RequestContextData | undefined {
    return tryGetRequestContext();
  }

  getDeviceId(fallback = process.env.DEVICE_ID ?? 'desktop-dev-001'): string {
    return this.tryGet()?.deviceId ?? fallback;
  }
}
