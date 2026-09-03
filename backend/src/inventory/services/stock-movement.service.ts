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
import { StockMovementListQueryDto } from '../dto/stock-movement-list-query.dto';
import { toStockMovementResponse } from '../mappers/stock-movement.mapper';
import { throwNotFound } from '../utils/inventory.util';

@Injectable()
export class StockMovementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: StockMovementListQueryDto) {
    const scope = getTenantScope(this.requestContext);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.StockMovementWhereInput = withBranchScope(scope, {
      ...(query.batchId ? { batchId: BigInt(query.batchId) } : {}),
      ...(query.medicineId ? { medicineId: BigInt(query.medicineId) } : {}),
      ...(query.movementType ? { movementType: query.movementType } : {}),
      ...(query.movementDirection
        ? { movementDirection: query.movementDirection }
        : {}),
      ...(query.fromDate || query.toDate
        ? {
            movementDate: {
              ...(query.fromDate ? { gte: query.fromDate } : {}),
              ...(query.toDate ? { lte: query.toDate } : {}),
            },
          }
        : {}),
      ...(search ? { movementNumber: { contains: search } } : {}),
    });

    const [total, rows] = await Promise.all([
      this.prisma.client.stockMovement.count({ where }),
      this.prisma.client.stockMovement.findMany({
        where,
        orderBy: { movementDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toStockMovementResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const scope = getTenantScope(this.requestContext);
    const movement = await this.prisma.client.stockMovement.findFirst({
      where: withBranchScope(scope, { id }),
    });

    if (!movement) {
      throwNotFound(
        ErrorCode.STOCK_MOVEMENT_NOT_FOUND,
        `Stock movement not found: ${id}`,
        { id: id.toString() },
      );
    }

    return toStockMovementResponse(movement);
  }
}
