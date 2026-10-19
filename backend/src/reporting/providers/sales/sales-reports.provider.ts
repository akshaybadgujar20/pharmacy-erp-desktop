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
  invoiceDateFilter,
  resolveReportBranchId,
} from '../../utils/transactional-report.util';

@Injectable()
export class SalesReportsProvider implements OnModuleInit {
  constructor(
    private readonly registry: ReportRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.dailySummary());
    this.registry.register(this.register());
    this.registry.register(this.gstSummary());
  }

  private dailySummary(): ReportDefinition {
    return {
      id: 'sales.daily-summary',
      name: 'Sales Daily Summary',
      category: ReportCategory.SALES,
      permission: ReportPermission.SALES_VIEW,
      run: (params, ctx) => this.runDailySummary(params, ctx),
    };
  }

  private register(): ReportDefinition {
    return {
      id: 'sales.register',
      name: 'Sales Register',
      category: ReportCategory.SALES,
      permission: ReportPermission.SALES_VIEW,
      run: (params, ctx) => this.runRegister(params, ctx),
    };
  }

  private gstSummary(): ReportDefinition {
    return {
      id: 'sales.gst-summary',
      name: 'Sales GST Summary',
      category: ReportCategory.SALES,
      permission: ReportPermission.SALES_VIEW,
      run: (params, ctx) => this.runGstSummary(params, ctx),
    };
  }

  private async runDailySummary(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const branchId = resolveReportBranchId(params, ctx);
    const where: Prisma.SalesInvoiceWhereInput = {
      branchId,
      deletedAt: null,
      status: { in: ['POSTED', 'PARTIALLY_RETURNED', 'RETURNED'] },
      ...invoiceDateFilter(params),
    };

    const rows = await this.prisma.client.salesInvoice.groupBy({
      by: ['invoiceDate'],
      where,
      _sum: { netAmount: true, taxAmount: true },
      _count: { id: true },
      orderBy: { invoiceDate: 'desc' },
    });

    return {
      columns: [
        { key: 'invoiceDate', label: 'Date', type: ReportColumnTypes.DATE },
        {
          key: 'invoiceCount',
          label: 'Invoices',
          type: ReportColumnTypes.NUMBER,
        },
        {
          key: 'netAmount',
          label: 'Net Amount',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
        {
          key: 'taxAmount',
          label: 'Tax Amount',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
      ],
      rows: rows.map((row) => ({
        invoiceDate: row.invoiceDate.toString(),
        invoiceCount: row._count.id,
        netAmount: decimalCell(row._sum.netAmount ?? 0),
        taxAmount: decimalCell(row._sum.taxAmount ?? 0),
      })),
    };
  }

  private async runRegister(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const branchId = resolveReportBranchId(params, ctx);
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const where: Prisma.SalesInvoiceWhereInput = {
      branchId,
      deletedAt: null,
      ...invoiceDateFilter(params),
    };

    const [total, invoices] = await Promise.all([
      this.prisma.client.salesInvoice.count({ where }),
      this.prisma.client.salesInvoice.findMany({
        where,
        orderBy: { invoiceDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      columns: [
        {
          key: 'invoiceNumber',
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
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate.toString(),
        status: inv.status,
        netAmount: decimalCell(inv.netAmount),
      })),
      pagination: buildPagination(total, page, pageSize),
    };
  }

  private async runGstSummary(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const branchId = resolveReportBranchId(params, ctx);
    const where: Prisma.SalesInvoiceWhereInput = {
      branchId,
      deletedAt: null,
      status: { in: ['POSTED', 'PARTIALLY_RETURNED', 'RETURNED'] },
      ...invoiceDateFilter(params),
    };

    const aggregate = await this.prisma.client.salesInvoice.aggregate({
      where,
      _sum: { taxAmount: true, netAmount: true, grossAmount: true },
      _count: { id: true },
    });

    return {
      columns: [
        { key: 'metric', label: 'Metric', type: ReportColumnTypes.STRING },
        {
          key: 'value',
          label: 'Value',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
      ],
      rows: [
        {
          metric: 'Invoice count',
          value: String(aggregate._count.id),
        },
        {
          metric: 'Gross amount',
          value: decimalCell(aggregate._sum.grossAmount ?? 0),
        },
        {
          metric: 'Tax amount',
          value: decimalCell(aggregate._sum.taxAmount ?? 0),
        },
        {
          metric: 'Net amount',
          value: decimalCell(aggregate._sum.netAmount ?? 0),
        },
      ],
    };
  }
}
