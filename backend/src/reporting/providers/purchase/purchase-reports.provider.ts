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
export class PurchaseReportsProvider implements OnModuleInit {
  constructor(
    private readonly registry: ReportRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.poStatus());
    this.registry.register(this.register());
    this.registry.register(this.supplierSummary());
  }

  private poStatus(): ReportDefinition {
    return {
      id: 'purchase.po-status',
      name: 'Purchase Order Status',
      category: ReportCategory.PURCHASE,
      permission: ReportPermission.PURCHASE_VIEW,
      run: (params, ctx) => this.runPoStatus(params, ctx),
    };
  }

  private register(): ReportDefinition {
    return {
      id: 'purchase.register',
      name: 'Purchase Register',
      category: ReportCategory.PURCHASE,
      permission: ReportPermission.PURCHASE_VIEW,
      run: (params, ctx) => this.runRegister(params, ctx),
    };
  }

  private supplierSummary(): ReportDefinition {
    return {
      id: 'purchase.supplier-summary',
      name: 'Supplier-wise Purchase',
      category: ReportCategory.PURCHASE,
      permission: ReportPermission.PURCHASE_VIEW,
      run: (params, ctx) => this.runSupplierSummary(params, ctx),
    };
  }

  private purchaseInvoiceDateFilter(
    params: ReportParams,
  ): Prisma.PurchaseInvoiceWhereInput {
    const { fromEpoch, toEpoch } = epochRangeFromParams(params);
    if (!fromEpoch && !toEpoch) {
      return {};
    }
    const invoiceDate: Prisma.BigIntFilter = {};
    if (fromEpoch) {
      invoiceDate.gte = fromEpoch;
    }
    if (toEpoch) {
      invoiceDate.lte = toEpoch;
    }
    return { invoiceDate };
  }

  private async runPoStatus(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const branchId = resolveReportBranchId(params, ctx);
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const where: Prisma.PurchaseOrderWhereInput = {
      branchId,
      deletedAt: null,
    };

    const [total, orders] = await Promise.all([
      this.prisma.client.purchaseOrder.count({ where }),
      this.prisma.client.purchaseOrder.findMany({
        where,
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      columns: [
        { key: 'purchaseOrderNumber', label: 'PO #', type: ReportColumnTypes.STRING },
        { key: 'orderDate', label: 'Date', type: ReportColumnTypes.DATE },
        { key: 'status', label: 'Status', type: ReportColumnTypes.STRING },
        {
          key: 'netAmount',
          label: 'Net',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
      ],
      rows: orders.map((o) => ({
        purchaseOrderNumber: o.purchaseOrderNumber,
        orderDate: o.orderDate.toString(),
        status: o.status,
        netAmount: decimalCell(o.netAmount),
      })),
      pagination: buildPagination(total, page, pageSize),
    };
  }

  private async runRegister(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const branchId = resolveReportBranchId(params, ctx);
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const where: Prisma.PurchaseInvoiceWhereInput = {
      branchId,
      deletedAt: null,
      ...this.purchaseInvoiceDateFilter(params),
    };

    const [total, invoices] = await Promise.all([
      this.prisma.client.purchaseInvoice.count({ where }),
      this.prisma.client.purchaseInvoice.findMany({
        where,
        orderBy: { invoiceDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      columns: [
        {
          key: 'purchaseInvoiceNumber',
          label: 'Invoice #',
          type: ReportColumnTypes.STRING,
        },
        { key: 'invoiceDate', label: 'Date', type: ReportColumnTypes.DATE },
        { key: 'status', label: 'Status', type: ReportColumnTypes.STRING },
        {
          key: 'netAmount',
          label: 'Net',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
      ],
      rows: invoices.map((inv) => ({
        purchaseInvoiceNumber: inv.purchaseInvoiceNumber,
        invoiceDate: inv.invoiceDate.toString(),
        status: inv.status,
        netAmount: decimalCell(inv.netAmount),
      })),
      pagination: buildPagination(total, page, pageSize),
    };
  }

  private async runSupplierSummary(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const branchId = resolveReportBranchId(params, ctx);
    const where: Prisma.PurchaseInvoiceWhereInput = {
      branchId,
      deletedAt: null,
      status: 'POSTED',
      ...this.purchaseInvoiceDateFilter(params),
    };

    const grouped = await this.prisma.client.purchaseInvoice.groupBy({
      by: ['supplierId'],
      where,
      _sum: { netAmount: true },
      _count: { id: true },
    });

    const supplierIds = grouped.map((g) => g.supplierId);
    const suppliers = await this.prisma.client.supplier.findMany({
      where: { id: { in: supplierIds } },
      select: {
        id: true,
        supplierCode: true,
        party: { select: { displayName: true } },
      },
    });
    const supplierMap = new Map(
      suppliers.map((s) => [s.id.toString(), s]),
    );

    return {
      columns: [
        { key: 'supplierCode', label: 'Supplier', type: ReportColumnTypes.STRING },
        {
          key: 'invoiceCount',
          label: 'Invoices',
          type: ReportColumnTypes.NUMBER,
        },
        {
          key: 'netAmount',
          label: 'Net Purchase',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
      ],
      rows: grouped.map((g) => {
        const supplier = supplierMap.get(g.supplierId.toString());
        return {
          supplierCode:
            supplier?.party.displayName ??
            supplier?.supplierCode ??
            g.supplierId.toString(),
          invoiceCount: g._count.id,
          netAmount: decimalCell(g._sum.netAmount ?? 0),
        };
      }),
    };
  }
}
