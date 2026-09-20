import { randomUUID } from 'crypto';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import type { RequestContextData } from '../../persistence/context/request-context';
import { RequestContextService } from '../../persistence/context/request-context.service';

const CORRELATION_HEADER = 'x-correlation-id';
const DEVICE_ID_HEADER = 'x-device-id';
const USER_ID_HEADER = 'x-user-id';
const COMPANY_ID_HEADER = 'x-company-id';
const BRANCH_ID_HEADER = 'x-branch-id';
const SESSION_ID_HEADER = 'x-session-id';

function parseBigIntHeader(value: string | undefined): bigint | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }
  return BigInt(value);
}

function parseBigIntFromHeaderOrEnv(
  headerValue: string | undefined,
  envKey: string,
): bigint | undefined {
  const fromHeader = parseBigIntHeader(headerValue);
  if (fromHeader !== undefined) {
    return fromHeader;
  }
  const envValue = process.env[envKey];
  if (envValue && /^\d+$/.test(envValue)) {
    return BigInt(envValue);
  }
  return undefined;
}

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const context = this.buildContext(req);
    res.setHeader(CORRELATION_HEADER, context.correlationId ?? '');

    void this.requestContext.run(context, () => {
      next();
    });
  }

  private buildContext(req: Request): RequestContextData {
    const correlationId =
      (req.headers[CORRELATION_HEADER] as string | undefined) ?? randomUUID();
    const deviceId =
      (req.headers[DEVICE_ID_HEADER] as string | undefined) ??
      process.env.DEVICE_ID ??
      'desktop-dev-001';

    const isDev = process.env.NODE_ENV !== 'production';

    const context: RequestContextData = {
      deviceId,
      correlationId,
      ipAddress: req.ip ?? req.socket.remoteAddress,
    };

    if (isDev) {
      // Only set tenant when header/env match real DB ids (no hardcoded defaults).
      const companyId = parseBigIntFromHeaderOrEnv(
        req.headers[COMPANY_ID_HEADER] as string | undefined,
        'COMPANY_ID',
      );
      if (companyId !== undefined) {
        context.companyId = companyId;
      }
      const branchId = parseBigIntFromHeaderOrEnv(
        req.headers[BRANCH_ID_HEADER] as string | undefined,
        'BRANCH_ID',
      );
      if (branchId !== undefined) {
        context.branchId = branchId;
      }
      context.userId = parseBigIntHeader(
        req.headers[USER_ID_HEADER] as string | undefined,
      );
      context.sessionId = req.headers[SESSION_ID_HEADER] as string | undefined;
    }

    return context;
  }
}
