import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { SyncConflictResolutionStatus } from '../constants/sync.constants';
import { ResolveSyncConflictDto } from '../dto/resolve-sync-conflict.dto';
import { SyncConflictListQueryDto } from '../dto/sync-conflict-list-query.dto';
import { toSyncConflictResponse } from '../mappers/sync-conflict.mapper';
import {
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from '../utils/sync.util';

@Injectable()
export class SyncConflictService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
  ) {}

  async list(query: SyncConflictListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.SyncConflictWhereInput = {
      ...(query.resolutionStatus
        ? { resolutionStatus: query.resolutionStatus }
        : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.deviceId ? { syncLog: { deviceId: query.deviceId } } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.syncConflict.count({ where }),
      this.prisma.client.syncConflict.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toSyncConflictResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const conflict = await this.prisma.client.syncConflict.findFirst({
      where: { id },
    });

    if (!conflict) {
      throwNotFound(
        ErrorCode.SYNC_CONFLICT_NOT_FOUND,
        `Sync conflict not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toSyncConflictResponse(conflict);
  }

  async resolve(id: bigint, dto: ResolveSyncConflictDto, username: string) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.syncConflict.findFirst({ where: { id } });

      if (!existing) {
        throwNotFound(
          ErrorCode.SYNC_CONFLICT_NOT_FOUND,
          `Sync conflict not found: ${id}`,
          { id: id.toString() },
        );
      }

      if (existing.resolutionStatus !== SyncConflictResolutionStatus.PENDING) {
        throwConflict(
          ErrorCode.SYNC_CONFLICT_ALREADY_RESOLVED,
          `Sync conflict is already resolved: ${id}`,
          {
            id: id.toString(),
            resolutionStatus: existing.resolutionStatus,
          },
        );
      }

      const now = BigInt(Date.now());
      const updateResult = await tx.syncConflict.updateMany({
        where: { id, version: dto.version },
        data: {
          resolutionStatus: SyncConflictResolutionStatus.MANUAL_RESOLVED,
          resolutionStrategy: dto.resolutionStrategy,
          resolvedBy: username,
          resolvedAt: now,
          remarks: dto.remarks ?? null,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Sync conflict version conflict or not found: ${id}`,
      );

      const conflict = await tx.syncConflict.findFirstOrThrow({
        where: { id },
      });
      return toSyncConflictResponse(conflict);
    });
  }
}
