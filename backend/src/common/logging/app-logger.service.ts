import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';

import { RequestContextService } from '../../persistence/context/request-context.service';
import { redactSensitiveFields } from './log-sanitizer';

@Injectable()
export class AppLogger implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly winston: Logger,
    private readonly requestContext: RequestContextService,
  ) {}

  log(message: unknown, context?: string): void {
    this.write('info', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    const meta =
      typeof message === 'object' && message !== null
        ? { ...(message as Record<string, unknown>), stack: trace }
        : { message, stack: trace };
    this.write('error', meta, context);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }

  info(meta: Record<string, unknown>, message: string): void {
    this.write('info', { ...meta, message }, undefined);
  }

  private write(level: string, message: unknown, context?: string): void {
    const payload = this.buildPayload(message, context);
    this.winston.log(level, payload);
  }

  private buildPayload(
    message: unknown,
    context?: string,
  ): Record<string, unknown> {
    const ctx = this.requestContext.tryGet();
    const base: Record<string, unknown> = {};

    if (ctx) {
      base.companyId = ctx.companyId.toString();
      base.branchId = ctx.branchId.toString();
      if (ctx.userId !== undefined) {
        base.userId = ctx.userId.toString();
      }
      base.deviceId = ctx.deviceId;
      if (ctx.correlationId) {
        base.correlationId = ctx.correlationId;
      }
    }

    if (context) {
      base.context = context;
    }

    if (typeof message === 'string') {
      base.message = message;
      return redactSensitiveFields(base);
    }

    if (message && typeof message === 'object') {
      return redactSensitiveFields({
        ...base,
        ...(message as Record<string, unknown>),
      });
    }

    base.message = String(message);
    return redactSensitiveFields(base);
  }
}
