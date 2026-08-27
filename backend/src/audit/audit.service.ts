import { HttpStatus, Injectable, Logger } from '@nestjs/common';

import { ApplicationException } from '../common/exceptions/application.exception';
import { ErrorCode } from '../common/exceptions/error-code';
import { RequestContextService } from '../persistence/context/request-context.service';
import type { TxClient } from '../persistence/prisma/prisma-tx.type';
import { AuditAction } from './audit-action.constants';
import { AuditModule } from './audit-module.constants';

export interface AuditLogInput {
  entityType: string;
  entityId?: bigint;
  entityUuid?: string;
  action: AuditAction;
  module: AuditModule;
  description?: string;
  userId?: bigint;
}

const AUDIT_ACTION_VALUES = new Set<string>(Object.values(AuditAction));
const AUDIT_MODULE_VALUES = new Set<string>(Object.values(AuditModule));

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly requestContext: RequestContextService) {}

  async log(tx: TxClient, input: AuditLogInput): Promise<void> {
    this.validateInput(input);

    const ctx = this.requestContext.tryGet();
    const userId = input.userId ?? ctx?.userId;

    if (userId == null && input.action !== AuditAction.SYNC) {
      this.logger.warn(
        `Audit log missing userId for ${input.module}:${input.action} on ${input.entityType}`,
      );
    }

    await tx.auditLog.create({
      data: {
        userId,
        companyId: ctx?.companyId,
        branchId: ctx?.branchId,
        entityType: input.entityType,
        entityId: input.entityId,
        entityUuid: input.entityUuid,
        action: input.action,
        module: input.module,
        description: input.description,
        ipAddress: ctx?.ipAddress,
        deviceId: ctx?.deviceId,
        sessionId: ctx?.sessionId,
        actionTimestamp: BigInt(Date.now()),
        correlationId: ctx?.correlationId,
        createdAt: BigInt(Date.now()),
      },
    });
  }

  private validateInput(input: AuditLogInput): void {
    if (!input.entityType?.trim()) {
      throw new ApplicationException(
        ErrorCode.VALIDATION_ERROR,
        'Audit entityType must be a non-empty string',
        HttpStatus.BAD_REQUEST,
        { field: 'entityType' },
      );
    }

    if (!AUDIT_ACTION_VALUES.has(input.action)) {
      throw new ApplicationException(
        ErrorCode.VALIDATION_ERROR,
        `Invalid audit action: ${input.action}`,
        HttpStatus.BAD_REQUEST,
        { field: 'action', value: input.action },
      );
    }

    if (!AUDIT_MODULE_VALUES.has(input.module)) {
      throw new ApplicationException(
        ErrorCode.VALIDATION_ERROR,
        `Invalid audit module: ${input.module}`,
        HttpStatus.BAD_REQUEST,
        { field: 'module', value: input.module },
      );
    }
  }
}
