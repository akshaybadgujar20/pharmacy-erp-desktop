import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPagination } from '../../../common/response/paginated-result';
import { PrismaService } from '../../../prisma.service';
import {
  ReportCategory,
  ReportPermission,
} from '../../constants/reporting.constants';
import {
  ReportColumnTypes,
  type ReportContext,
  type ReportDefinition,
  type ReportParams,
  type ReportResult,
} from '../../core/report-definition.interface';
import { ReportRegistryService } from '../../core/report-registry.service';
import {
  decimalCell,
  epochRangeFromParams,
  resolveReportBranchId,
} from '../../utils/transactional-report.util';

@Injectable()
export class InventoryReportsProvider implements OnModuleInit {
  constructor(
    private readonly registry: ReportRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.stockOnHand());
    this.registry.register(this.nearExpiry());
    this.registry.register(this.movementRegister());
  }

  private stockOnHand(): ReportDefinition {
    return {
      id: 'inventory.stock-on-hand',
      name: 'Stock On Hand',
      category: ReportCategory.INVENTORY,
      permission: ReportPermission.INVENTORY_VIEW,
      run: (params, ctx) => this.runStockOnHand(params, ctx),
    };
  }

  private nearExpiry(): ReportDefinition {
    return {
      id: 'inventory.near-expiry',
      name: 'Near Expiry Stock',
      category: ReportCategory.INVENTORY,
      permission: ReportPermission.INVENTORY_VIEW,
      run: (params, ctx) => this.runNearExpiry(params, ctx),
    };
  }

  private movementRegister(): ReportDefinition {
    return {
      id: 'inventory.movement-register',
      name: 'Stock Movement Register',
      category: ReportCategory.INVENTORY,
      permission: ReportPermission.INVENTORY_VIEW,
      run: (params, ctx) => this.runMovementRegister(params, ctx),
    };
  }

  private async runStockOnHand(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const branchId = resolveReportBranchId(params, ctx);
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const where: Prisma.StockWhereInput = {
      branchId,
      availableQuantity: { gt: 0 },
    };

    const [total, stocks] = await Promise.all([
      this.prisma.client.stock.count({ where }),
      this.prisma.client.stock.findMany({
        where,
        include: {
          batch: {
            include: {
              medicine: { select: { medicineName: true, medicineCode: true } },
            },
          },
        },
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      columns: [
        {
          key: 'medicineCode',
          label: 'Medicine',
          type: ReportColumnTypes.STRING,
        },
        { key: 'batchNumber', label: 'Batch', type: ReportColumnTypes.STRING },
        {
          key: 'availableQuantity',
          label: 'Qty',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
        { key: 'expiryDate', label: 'Expiry', type: ReportColumnTypes.DATE },
      ],
      rows: stocks.map((s) => ({
        medicineCode: s.batch.medicine.medicineCode,
        batchNumber: s.batch.batchNumber,
        availableQuantity: decimalCell(s.availableQuantity),
        expiryDate: s.batch.expiryDate.toString(),
      })),
      pagination: buildPagination(total, page, pageSize),
    };
  }

  private async runNearExpiry(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const branchId = resolveReportBranchId(params, ctx);
    const horizon = BigInt(Date.now() + 90 * 86_400_000);
    const stocks = await this.prisma.client.stock.findMany({
      where: {
        branchId,
        availableQuantity: { gt: 0 },
        batch: { expiryDate: { lte: horizon }, deletedAt: null },
      },
      include: {
        batch: {
          include: { medicine: { select: { medicineCode: true } } },
        },
      },
      orderBy: { batch: { expiryDate: 'asc' } },
      take: 500,
    });

    return {
      columns: [
        {
          key: 'medicineCode',
          label: 'Medicine',
          type: ReportColumnTypes.STRING,
        },
        { key: 'batchNumber', label: 'Batch', type: ReportColumnTypes.STRING },
        { key: 'expiryDate', label: 'Expiry', type: ReportColumnTypes.DATE },
        {
          key: 'availableQuantity',
          label: 'Qty',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
      ],
      rows: stocks.map((s) => ({
        medicineCode: s.batch.medicine.medicineCode,
        batchNumber: s.batch.batchNumber,
        expiryDate: s.batch.expiryDate.toString(),
        availableQuantity: decimalCell(s.availableQuantity),
      })),
    };
  }

  private async runMovementRegister(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const branchId = resolveReportBranchId(params, ctx);
    const { fromEpoch, toEpoch } = epochRangeFromParams(params);
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const where: Prisma.StockMovementWhereInput = {
      branchId,
      ...(fromEpoch || toEpoch
        ? {
            movementDate: {
              ...(fromEpoch ? { gte: fromEpoch } : {}),
              ...(toEpoch ? { lte: toEpoch } : {}),
            },
          }
        : {}),
    };

    const [total, movements] = await Promise.all([
      this.prisma.client.stockMovement.count({ where }),
      this.prisma.client.stockMovement.findMany({
        where,
        orderBy: { movementDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      columns: [
        {
          key: 'movementNumber',
          label: 'Movement #',
          type: ReportColumnTypes.STRING,
        },
        { key: 'movementDate', label: 'Date', type: ReportColumnTypes.DATE },
        { key: 'movementType', label: 'Type', type: ReportColumnTypes.STRING },
        {
          key: 'quantity',
          label: 'Qty',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
      ],
      rows: movements.map((m) => ({
        movementNumber: m.movementNumber,
        movementDate: m.movementDate.toString(),
        movementType: m.movementType,
        quantity: decimalCell(m.quantity),
      })),
      pagination: buildPagination(total, page, pageSize),
    };
  }
}
