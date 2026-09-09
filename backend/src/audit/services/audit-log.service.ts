import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import {
  getTenantScope,
  withBranchScope,
} from '../../persistence/context/tenant-scope.util';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { PrismaService } from '../../prisma.service';
import { AuditLogListQueryDto } from '../dto/audit-log-list-query.dto';
import { toAuditLogResponse } from '../mappers/audit-log.mapper';
import { throwNotFound } from '../utils/audit-query.util';

@Injectable()
export class AuditLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: AuditLogListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.AuditLogWhereInput = withBranchScope(scope, {
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.entityUuid ? { entityUuid: query.entityUuid } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.module ? { module: query.module } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.fromTimestamp || query.toTimestamp
        ? {
            actionTimestamp: {
              ...(query.fromTimestamp
                ? { gte: BigInt(query.fromTimestamp) }
                : {}),
              ...(query.toTimestamp ? { lte: BigInt(query.toTimestamp) } : {}),
            },
          }
        : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.auditLog.count({ where }),
      this.prisma.client.auditLog.findMany({
        where,
        orderBy: { actionTimestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toAuditLogResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const auditLog = await this.prisma.client.auditLog.findFirst({
      where: withBranchScope(scope, { id }),
    });

    if (!auditLog) {
      throwNotFound(
        ErrorCode.AUDIT_LOG_NOT_FOUND,
        `Audit log not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toAuditLogResponse(auditLog);
  }
}
