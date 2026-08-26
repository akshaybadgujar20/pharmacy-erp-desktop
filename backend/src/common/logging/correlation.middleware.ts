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

function parseRequiredBigInt(
  headerValue: string | undefined,
  envKey: string,
  defaultValue: string,
): bigint {
  const raw = headerValue ?? process.env[envKey] ?? defaultValue;
  if (!/^\d+$/.test(raw)) {
    return BigInt(defaultValue);
  }
  return BigInt(raw);
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
      context.companyId = parseRequiredBigInt(
        req.headers[COMPANY_ID_HEADER] as string | undefined,
        'COMPANY_ID',
        '1',
      );
      context.branchId = parseRequiredBigInt(
        req.headers[BRANCH_ID_HEADER] as string | undefined,
        'BRANCH_ID',
        '1',
      );
      context.userId = parseBigIntHeader(
        req.headers[USER_ID_HEADER] as string | undefined,
      );
      context.sessionId = req.headers[SESSION_ID_HEADER] as string | undefined;
    }

    return context;
  }
}
