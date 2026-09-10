import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { PrismaService } from '../../prisma.service';
import { SyncLogListQueryDto } from '../dto/sync-log-list-query.dto';
import { toSyncLogResponse } from '../mappers/sync-log.mapper';
import { buildEpochDateRangeFilter, throwNotFound } from '../utils/sync.util';

@Injectable()
export class SyncLogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: SyncLogListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const startedAtRange = buildEpochDateRangeFilter(
      query.dateFrom,
      query.dateTo,
    );

    const where: Prisma.SyncLogWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.syncType ? { syncType: query.syncType } : {}),
      ...(query.syncDirection ? { syncDirection: query.syncDirection } : {}),
      ...(query.deviceId ? { deviceId: query.deviceId } : {}),
      ...(startedAtRange ? { startedAt: startedAtRange } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.syncLog.count({ where }),
      this.prisma.client.syncLog.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toSyncLogResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const syncLog = await this.prisma.client.syncLog.findFirst({
      where: { id },
    });

    if (!syncLog) {
      throwNotFound(ErrorCode.SYNC_LOG_NOT_FOUND, `Sync log not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toSyncLogResponse(syncLog);
  }
}
