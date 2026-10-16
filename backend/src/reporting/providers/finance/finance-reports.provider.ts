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
  invoiceDateFilter,
  resolveReportBranchId,
} from '../../utils/transactional-report.util';

@Injectable()
export class FinanceReportsProvider implements OnModuleInit {
  constructor(
    private readonly registry: ReportRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.dayBook());
    this.registry.register(this.trialBalance());
    this.registry.register(this.gstSummary());
    this.registry.register(this.monthEndPack());
  }

  private dayBook(): ReportDefinition {
    return {
      id: 'finance.day-book',
      name: 'Day Book',
      category: ReportCategory.FINANCE,
      permission: ReportPermission.FINANCE_VIEW,
      run: (params, ctx) => this.runDayBook(params, ctx),
    };
  }

  private trialBalance(): ReportDefinition {
    return {
      id: 'finance.trial-balance',
      name: 'Trial Balance',
      category: ReportCategory.FINANCE,
      permission: ReportPermission.FINANCE_VIEW,
      run: (params, ctx) => this.runTrialBalance(params, ctx),
    };
  }

  private gstSummary(): ReportDefinition {
    return {
      id: 'finance.gst-summary',
      name: 'GST Summary',
      category: ReportCategory.FINANCE,
      permission: ReportPermission.FINANCE_VIEW,
      run: (params, ctx) => this.runGstSummary(params, ctx),
    };
  }

  private monthEndPack(): ReportDefinition {
    return {
      id: 'finance.month-end-pack',
      name: 'Month-end Pack',
      category: ReportCategory.FINANCE,
      permission: ReportPermission.FINANCE_VIEW,
      run: (params, ctx) => this.runMonthEndPack(params, ctx),
    };
  }

  private entryDateFilter(params: ReportParams): Prisma.LedgerEntryWhereInput {
    const { fromEpoch, toEpoch } = epochRangeFromParams(params);
    if (!fromEpoch && !toEpoch) {
      return {};
    }
    return {
      transactionDate: {
        ...(fromEpoch ? { gte: fromEpoch } : {}),
        ...(toEpoch ? { lte: toEpoch } : {}),
      },
    };
  }

  private async runDayBook(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const where: Prisma.LedgerEntryWhereInput = {
      deletedAt: null,
      ...this.entryDateFilter(params),
    };

    const [total, entries] = await Promise.all([
      this.prisma.client.ledgerEntry.count({ where }),
      this.prisma.client.ledgerEntry.findMany({
        where,
        include: { ledger: { select: { ledgerCode: true, ledgerName: true } } },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      columns: [
        { key: 'transactionDate', label: 'Date', type: ReportColumnTypes.DATE },
        { key: 'ledgerCode', label: 'Ledger', type: ReportColumnTypes.STRING },
        {
          key: 'debitAmount',
          label: 'Debit',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
        {
          key: 'creditAmount',
          label: 'Credit',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
      ],
      rows: entries.map((e) => ({
        transactionDate: e.transactionDate.toString(),
        ledgerCode: e.ledger.ledgerCode,
        debitAmount: decimalCell(e.debitAmount),
        creditAmount: decimalCell(e.creditAmount),
      })),
      pagination: buildPagination(total, page, pageSize),
    };
  }

  private async runTrialBalance(
    params: ReportParams,
    _ctx: ReportContext,
  ): Promise<ReportResult> {
    const where: Prisma.LedgerEntryWhereInput = {
      deletedAt: null,
      ...this.entryDateFilter(params),
    };

    const grouped = await this.prisma.client.ledgerEntry.groupBy({
      by: ['ledgerId'],
      where,
      _sum: { debitAmount: true, creditAmount: true },
    });

    const ledgerIds = grouped.map((g) => g.ledgerId);
    const ledgers = await this.prisma.client.ledger.findMany({
      where: { id: { in: ledgerIds } },
      select: { id: true, ledgerCode: true, ledgerName: true },
    });
    const ledgerMap = new Map(ledgers.map((l) => [l.id.toString(), l]));

    let totalDebit = new Prisma.Decimal(0);
    let totalCredit = new Prisma.Decimal(0);

    const rows = grouped.map((g) => {
      const debit = g._sum.debitAmount ?? new Prisma.Decimal(0);
      const credit = g._sum.creditAmount ?? new Prisma.Decimal(0);
      totalDebit = totalDebit.add(debit);
      totalCredit = totalCredit.add(credit);
      const ledger = ledgerMap.get(g.ledgerId.toString());
      return {
        ledgerCode: ledger?.ledgerCode ?? g.ledgerId.toString(),
        ledgerName: ledger?.ledgerName ?? '',
        debitAmount: decimalCell(debit),
        creditAmount: decimalCell(credit),
      };
    });

    return {
      columns: [
        { key: 'ledgerCode', label: 'Code', type: ReportColumnTypes.STRING },
        { key: 'ledgerName', label: 'Ledger', type: ReportColumnTypes.STRING },
        {
          key: 'debitAmount',
          label: 'Debit',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
        {
          key: 'creditAmount',
          label: 'Credit',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
      ],
      rows,
      totals: {
        debitAmount: decimalCell(totalDebit),
        creditAmount: decimalCell(totalCredit),
      },
    };
  }

  private async runGstSummary(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const branchId = resolveReportBranchId(params, ctx);
    const salesWhere: Prisma.SalesInvoiceWhereInput = {
      branchId,
      deletedAt: null,
      status: { in: ['POSTED', 'PARTIALLY_RETURNED', 'RETURNED'] },
      ...invoiceDateFilter(params),
    };
    const purchaseWhere: Prisma.PurchaseInvoiceWhereInput = {
      branchId,
      deletedAt: null,
      status: 'POSTED',
      ...(epochRangeFromParams(params).fromEpoch
        ? {
            invoiceDate: {
              gte: epochRangeFromParams(params).fromEpoch,
              ...(epochRangeFromParams(params).toEpoch
                ? { lte: epochRangeFromParams(params).toEpoch }
                : {}),
            },
          }
        : {}),
    };

    const [salesTax, purchaseTax] = await Promise.all([
      this.prisma.client.salesInvoice.aggregate({
        where: salesWhere,
        _sum: { taxAmount: true },
      }),
      this.prisma.client.purchaseInvoice.aggregate({
        where: purchaseWhere,
        _sum: { taxAmount: true },
      }),
    ]);

    const outputTax = salesTax._sum.taxAmount ?? new Prisma.Decimal(0);
    const inputTax = purchaseTax._sum.taxAmount ?? new Prisma.Decimal(0);

    return {
      columns: [
        { key: 'metric', label: 'Metric', type: ReportColumnTypes.STRING },
        {
          key: 'value',
          label: 'Amount',
          type: ReportColumnTypes.DECIMAL,
          align: 'right',
        },
      ],
      rows: [
        { metric: 'Output GST (sales)', value: decimalCell(outputTax) },
        { metric: 'Input GST (purchase)', value: decimalCell(inputTax) },
        {
          metric: 'Net GST payable',
          value: decimalCell(outputTax.sub(inputTax)),
        },
      ],
    };
  }

  private async runMonthEndPack(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    const trial = await this.runTrialBalance(params, ctx);
    const gst = await this.runGstSummary(params, ctx);

    return {
      columns: [
        { key: 'section', label: 'Section', type: ReportColumnTypes.STRING },
        { key: 'detail', label: 'Detail', type: ReportColumnTypes.STRING },
      ],
      rows: [
        {
          section: 'Trial balance',
          detail: `${trial.rows.length} ledgers; debits ${trial.totals?.debitAmount ?? '0'} / credits ${trial.totals?.creditAmount ?? '0'}`,
        },
        ...gst.rows.map((row) => ({
          section: 'GST',
          detail: `${row.metric}: ${row.value}`,
        })),
      ],
    };
  }
}
