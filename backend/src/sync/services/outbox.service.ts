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
import { OutboxSyncStatus } from '../../persistence/outbox/outbox-operation.constants';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { OutboxAuditEntityType } from '../constants/sync.constants';
import { OutboxListQueryDto } from '../dto/outbox-list-query.dto';
import { RetryOutboxDto } from '../dto/retry-outbox.dto';
import { toOutboxResponse } from '../mappers/outbox.mapper';
import {
  assertOutboxRetryAllowed,
  optimisticUpdate,
  throwNotFound,
} from '../utils/sync.util';

@Injectable()
export class OutboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: OutboxListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.OutboxWhereInput = {
      ...(query.syncStatus ? { syncStatus: query.syncStatus } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.deviceId ? { deviceId: query.deviceId } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.outbox.count({ where }),
      this.prisma.client.outbox.findMany({
        where,
        orderBy: [{ sequenceNo: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toOutboxResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const outbox = await this.prisma.client.outbox.findFirst({
      where: { id },
    });

    if (!outbox) {
      throwNotFound(
        ErrorCode.OUTBOX_NOT_FOUND,
        `Outbox record not found: ${id}`,
        {
          id: id.toString(),
        },
      );
    }

    return toOutboxResponse(outbox);
  }

  async retry(id: bigint, dto: RetryOutboxDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.outbox.findFirst({ where: { id } });

      if (!existing) {
        throwNotFound(
          ErrorCode.OUTBOX_NOT_FOUND,
          `Outbox record not found: ${id}`,
          { id: id.toString() },
        );
      }

      assertOutboxRetryAllowed(existing.syncStatus);

      const updateResult = await tx.outbox.updateMany({
        where: { id, version: dto.version },
        data: {
          syncStatus: OutboxSyncStatus.PENDING,
          retryCount: { increment: 1 },
          lastError: null,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        id,
        `Outbox version conflict or not found: ${id}`,
      );

      const outbox = await tx.outbox.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxAuditEntityType,
        entityId: outbox.id,
        entityUuid: outbox.uuid,
        action: AuditAction.SYNC,
        module: AuditModule.SYNCHRONIZATION,
        description: `Outbox retry queued (retryCount=${outbox.retryCount})`,
      });

      return toOutboxResponse(outbox);
    });
  }
}
