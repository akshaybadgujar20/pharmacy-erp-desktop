import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import {
  SyncConflictAuditEntityType,
  SyncConflictResolutionStatus,
  SyncConflictResolutionStrategy,
} from '../constants/sync.constants';
import { SyncApplyService } from './sync-apply.service';
import { extractApplyData } from '../apply/sync-apply.util';
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
    private readonly auditService: AuditService,
    private readonly syncApply: SyncApplyService,
  ) {}

  async list(query: SyncConflictListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const syncLogId = query.syncLogId ? BigInt(query.syncLogId) : undefined;

    const where: Prisma.SyncConflictWhereInput = {
      ...(query.resolutionStatus
        ? { resolutionStatus: query.resolutionStatus }
        : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(syncLogId != null ? { syncLogId } : {}),
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

      if (
        dto.resolutionStrategy === SyncConflictResolutionStrategy.SERVER_WINS
      ) {
        const serverData = extractApplyData(existing.serverPayload);
        const entityVersion =
          typeof serverData.version === 'string' ||
          typeof serverData.version === 'number'
            ? String(serverData.version)
            : existing.version.toString();
        const outcome = await this.syncApply.applyPullRecord(
          tx,
          {
            entityType: existing.entityType,
            entityUuid: existing.entityUuid,
            operation: 'UPDATE',
            entityVersion,
            originDeviceId: 'cloud',
            payload: existing.serverPayload,
          },
          'cloud',
        );
        if (outcome.kind !== 'applied') {
          throwConflict(
            ErrorCode.BAD_REQUEST,
            outcome.kind === 'conflict'
              ? outcome.message
              : 'Server payload could not be applied',
            { id: id.toString() },
          );
        }
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

      await this.auditService.log(tx, {
        entityType: SyncConflictAuditEntityType,
        entityId: conflict.id,
        entityUuid: conflict.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.SYNCHRONIZATION,
        description: `Sync conflict resolved by ${username} (${dto.resolutionStrategy}) for ${conflict.entityType}:${conflict.entityUuid}`,
      });

      return toSyncConflictResponse(conflict);
    });
  }
}
