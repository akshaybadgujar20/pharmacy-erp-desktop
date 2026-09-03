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
import { StockListQueryDto } from '../dto/stock-list-query.dto';
import { toStockResponse } from '../mappers/stock.mapper';
import { throwNotFound } from '../utils/inventory.util';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: StockListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.StockWhereInput = withBranchScope(scope, {
      deletedAt: null,
      ...(query.batchId ? { batchId: BigInt(query.batchId) } : {}),
      ...(query.medicineId
        ? { batch: { medicineId: BigInt(query.medicineId), deletedAt: null } }
        : {}),
      ...(search
        ? { batch: { batchNumber: { contains: search }, deletedAt: null } }
        : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.stock.count({ where }),
      this.prisma.client.stock.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toStockResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const stock = await this.prisma.client.stock.findFirst({
      where: withBranchScope(scope, { id, deletedAt: null }),
    });

    if (!stock) {
      throwNotFound(ErrorCode.STOCK_NOT_FOUND, `Stock not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toStockResponse(stock);
  }
}
