import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { PrismaService } from '../../prisma.service';
import { ChangeHistoryListQueryDto } from '../dto/change-history-list-query.dto';
import { toChangeHistoryResponse } from '../mappers/change-history.mapper';
import { throwNotFound } from '../utils/audit-query.util';

@Injectable()
export class ChangeHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ChangeHistoryListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.ChangeHistoryWhereInput = {
      ...(query.auditLogId ? { auditLogId: query.auditLogId } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.entityUuid ? { entityUuid: query.entityUuid } : {}),
      ...(query.fieldName ? { fieldName: query.fieldName } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.changeHistory.count({ where }),
      this.prisma.client.changeHistory.findMany({
        where,
        orderBy: { changedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toChangeHistoryResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const changeHistory = await this.prisma.client.changeHistory.findFirst({
      where: { id },
    });

    if (!changeHistory) {
      throwNotFound(
        ErrorCode.CHANGE_HISTORY_NOT_FOUND,
        `Change history not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toChangeHistoryResponse(changeHistory);
  }
}
