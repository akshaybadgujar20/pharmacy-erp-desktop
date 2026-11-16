import { Injectable } from '@nestjs/common';
import { RequestContextService } from '../../persistence/context/request-context.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class DeviceSyncStateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async getOrCreateForCurrentContext() {
    const deviceId = this.requestContext.getDeviceId();
    const branchId = this.requireBranchId();
    const now = BigInt(Date.now());

    const existing = await this.prisma.client.deviceSyncState.findFirst({
      where: { deviceId, branchId },
    });
    if (existing) {
      return existing;
    }

    return this.prisma.client.deviceSyncState.create({
      data: {
        deviceId,
        branchId,
        createdAt: now,
        updatedAt: now,
      },
    });
  }

  async updatePullCursor(
    tx: TxClient,
    stateId: bigint,
    cursor: string | null,
    stateVersion: bigint,
  ) {
    const now = BigInt(Date.now());
    const result = await tx.deviceSyncState.updateMany({
      where: { id: stateId, version: stateVersion },
      data: {
        lastPullCursor: cursor,
        lastPullAt: now,
        updatedAt: now,
        version: { increment: 1 },
      },
    });
    return result.count === 1;
  }

  async touchPushAt(stateId: bigint) {
    const now = BigInt(Date.now());
    await this.prisma.client.deviceSyncState.update({
      where: { id: stateId },
      data: {
        lastPushAt: now,
        updatedAt: now,
        version: { increment: 1 },
      },
    });
  }

  private requireBranchId(): bigint {
    const branchId = this.requestContext.tryGet()?.branchId;
    if (branchId == null) {
      throw new Error('branchId is required in request context for sync');
    }
    return branchId;
  }
}
