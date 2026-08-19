import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { RequestContextService } from '../context/request-context.service';
import type { TxClient } from '../prisma/prisma-tx.type';
import { OutboxOperation, OutboxSyncStatus } from './outbox-operation.constants';

export interface OutboxEnqueueInput {
  entityType: string;
  entityUuid: string;
  operation: OutboxOperation | string;
  payload: Prisma.InputJsonValue;
  branchId?: bigint;
  payloadVersion?: number;
}

@Injectable()
export class OutboxService {
  constructor(private readonly requestContext: RequestContextService) {}

  async enqueue(tx: TxClient, input: OutboxEnqueueInput) {
    const deviceId = this.requestContext.getDeviceId();
    const aggregate = await tx.outbox.aggregate({
      where: { deviceId },
      _max: { sequenceNo: true },
    });
    const sequenceNo = (aggregate._max.sequenceNo ?? 0n) + 1n;
    const operationId = `${deviceId}:${input.entityType}:${input.entityUuid}:${input.operation}:${randomUUID()}`;

    return tx.outbox.create({
      data: {
        entityType: input.entityType,
        entityUuid: input.entityUuid,
        operation: input.operation,
        payload: input.payload,
        payloadVersion: input.payloadVersion ?? 1,
        deviceId,
        branchId: input.branchId,
        operationId,
        sequenceNo,
        syncStatus: OutboxSyncStatus.PENDING,
      },
    });
  }
}
