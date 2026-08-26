import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import { RequestContextService } from '../context/request-context.service';
import type { TxClient } from '../prisma/prisma-tx.type';
import {
  OutboxOperation,
  OutboxSyncStatus,
} from './outbox-operation.constants';

export interface OutboxEnqueueInput {
  entityType: string;
  entityUuid: string;
  operation: OutboxOperation;
  payload: Prisma.InputJsonValue;
  branchId?: bigint;
  payloadVersion?: number;
  operationId?: string;
}

const MAX_SEQUENCE_ALLOCATION_ATTEMPTS = 5;

@Injectable()
export class OutboxService {
  constructor(private readonly requestContext: RequestContextService) {}

  async enqueue(tx: TxClient, input: OutboxEnqueueInput) {
    const deviceId = this.requireDeviceId();
    const branchId = this.resolveBranchId(input.branchId);
    const operationId =
      input.operationId ??
      `${deviceId}:${input.entityType}:${input.entityUuid}:${input.operation}`;

    for (
      let attempt = 0;
      attempt < MAX_SEQUENCE_ALLOCATION_ATTEMPTS;
      attempt++
    ) {
      const aggregate = await tx.outbox.aggregate({
        where: { deviceId },
        _max: { sequenceNo: true },
      });
      const sequenceNo = (aggregate._max.sequenceNo ?? 0n) + 1n;

      try {
        return await tx.outbox.create({
          data: {
            entityType: input.entityType,
            entityUuid: input.entityUuid,
            operation: input.operation,
            payload: input.payload,
            payloadVersion: input.payloadVersion ?? 1,
            deviceId,
            branchId,
            operationId,
            sequenceNo,
            syncStatus: OutboxSyncStatus.PENDING,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          attempt < MAX_SEQUENCE_ALLOCATION_ATTEMPTS - 1
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new ApplicationException(
      ErrorCode.OUTBOX_DUPLICATE_OPERATION,
      'Failed to allocate outbox sequence number',
      HttpStatus.CONFLICT,
      { deviceId },
      true,
    );
  }

  private requireDeviceId(): string {
    const deviceId = this.requestContext.tryGet()?.deviceId;
    const isProd = process.env.NODE_ENV === 'production';

    if (!deviceId || deviceId === 'desktop-dev-001') {
      if (isProd) {
        throw new ApplicationException(
          ErrorCode.BAD_REQUEST,
          'deviceId is required in request context',
          HttpStatus.BAD_REQUEST,
        );
      }
      return deviceId ?? process.env.DEVICE_ID ?? 'desktop-dev-001';
    }

    return deviceId;
  }

  private resolveBranchId(explicitBranchId?: bigint): bigint | undefined {
    const ctx = this.requestContext.tryGet();
    if (
      explicitBranchId &&
      ctx?.branchId &&
      explicitBranchId !== ctx.branchId
    ) {
      throw new ApplicationException(
        ErrorCode.FORBIDDEN,
        'Outbox branchId does not match request context',
        HttpStatus.FORBIDDEN,
        {
          requestedBranchId: explicitBranchId.toString(),
          contextBranchId: ctx.branchId.toString(),
        },
      );
    }

    return explicitBranchId ?? ctx?.branchId;
  }
}
