import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import type { RequestContextData } from './request-context';
import {
  getRequestContext,
  runWithRequestContext,
  tryGetRequestContext,
} from './request-context.storage';

@Injectable()
export class RequestContextService {
  run<T>(
    context: RequestContextData,
    fn: () => T | Promise<T>,
  ): T | Promise<T> {
    return runWithRequestContext(context, fn);
  }

  get(): RequestContextData {
    return getRequestContext();
  }

  tryGet(): RequestContextData | undefined {
    return tryGetRequestContext();
  }

  getDeviceId(): string {
    const deviceId = this.tryGet()?.deviceId;
    const isProd = process.env.NODE_ENV === 'production';

    if (!deviceId) {
      if (isProd) {
        throw new ApplicationException(
          ErrorCode.BAD_REQUEST,
          'deviceId is required in request context',
          HttpStatus.BAD_REQUEST,
        );
      }
      return process.env.DEVICE_ID ?? 'desktop-dev-001';
    }

    if (isProd && deviceId === 'desktop-dev-001') {
      throw new ApplicationException(
        ErrorCode.BAD_REQUEST,
        'deviceId is required in request context',
        HttpStatus.BAD_REQUEST,
      );
    }

    return deviceId;
  }
}
