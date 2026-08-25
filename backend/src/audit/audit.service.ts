import { Injectable } from '@nestjs/common';

import { RequestContextService } from '../persistence/context/request-context.service';
import type { TxClient } from '../persistence/prisma/prisma-tx.type';
import type { AuditAction } from './audit-action.constants';
import type { AuditModule } from './audit-module.constants';

export interface AuditLogInput {
  entityType: string;
  entityId?: bigint;
  entityUuid?: string;
  action: AuditAction;
  module: AuditModule;
  description?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly requestContext: RequestContextService) {}

  async log(tx: TxClient, input: AuditLogInput): Promise<void> {
    const ctx = this.requestContext.tryGet();

    await tx.auditLog.create({
      data: {
        userId: ctx?.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        entityUuid: input.entityUuid,
        action: input.action,
        module: input.module,
        description: input.description,
        ipAddress: ctx?.ipAddress,
        deviceId: ctx?.deviceId,
        sessionId: ctx?.sessionId,
        actionTimestamp: new Date(),
        correlationId: ctx?.correlationId,
      },
    });
  }
}
