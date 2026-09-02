import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { buildPagination } from '../../../common/response/paginated-result';
import { serializeDecimal } from '../../../party/utils/party.util';
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

const CUSTOMER_LIST_COLUMNS = [
  {
    key: 'customerCode',
    label: 'Customer Code',
    type: ReportColumnTypes.STRING,
  },
  { key: 'displayName', label: 'Name', type: ReportColumnTypes.STRING },
  { key: 'customerType', label: 'Type', type: ReportColumnTypes.STRING },
  {
    key: 'creditLimit',
    label: 'Credit Limit',
    type: ReportColumnTypes.DECIMAL,
    align: 'right' as const,
  },
  {
    key: 'outstandingAmount',
    label: 'Outstanding',
    type: ReportColumnTypes.DECIMAL,
    align: 'right' as const,
  },
  { key: 'isActive', label: 'Active', type: ReportColumnTypes.BOOLEAN },
];

const SUPPLIER_LIST_COLUMNS = [
  {
    key: 'supplierCode',
    label: 'Supplier Code',
    type: ReportColumnTypes.STRING,
  },
  { key: 'displayName', label: 'Name', type: ReportColumnTypes.STRING },
  { key: 'supplierType', label: 'Type', type: ReportColumnTypes.STRING },
  {
    key: 'creditLimit',
    label: 'Credit Limit',
    type: ReportColumnTypes.DECIMAL,
    align: 'right' as const,
  },
  {
    key: 'outstandingAmount',
    label: 'Outstanding',
    type: ReportColumnTypes.DECIMAL,
    align: 'right' as const,
  },
  { key: 'isActive', label: 'Active', type: ReportColumnTypes.BOOLEAN },
];

const CUSTOMER_OUTSTANDING_COLUMNS = [
  {
    key: 'customerCode',
    label: 'Customer Code',
    type: ReportColumnTypes.STRING,
  },
  { key: 'displayName', label: 'Name', type: ReportColumnTypes.STRING },
  {
    key: 'outstandingAmount',
    label: 'Outstanding',
    type: ReportColumnTypes.DECIMAL,
    align: 'right' as const,
  },
];

@Injectable()
export class PartyReportsProvider implements OnModuleInit {
  constructor(
    private readonly registry: ReportRegistryService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this.buildCustomerListDefinition());
    this.registry.register(this.buildSupplierListDefinition());
    this.registry.register(this.buildCustomerOutstandingDefinition());
  }

  private buildCustomerListDefinition(): ReportDefinition {
    return {
      id: 'party.customer-list',
      name: 'Customer List',
      category: ReportCategory.PARTY,
      permission: ReportPermission.PARTY_VIEW,
      run: (params, ctx) => this.runCustomerList(params, ctx),
    };
  }

  private buildSupplierListDefinition(): ReportDefinition {
    return {
      id: 'party.supplier-list',
      name: 'Supplier List',
      category: ReportCategory.PARTY,
      permission: ReportPermission.PARTY_VIEW,
      run: (params, ctx) => this.runSupplierList(params, ctx),
    };
  }

  private buildCustomerOutstandingDefinition(): ReportDefinition {
    return {
      id: 'party.customer-outstanding',
      name: 'Customer Outstanding',
      category: ReportCategory.PARTY,
      permission: ReportPermission.PARTY_VIEW,
      run: (params, ctx) => this.runCustomerOutstanding(params, ctx),
    };
  }

  private async runCustomerList(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    void ctx;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const search =
      typeof params.search === 'string' ? params.search.trim() : '';
    const dateFilter = this.buildCreatedAtFilter(params);

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      party: { deletedAt: null },
      ...(dateFilter ? { createdAt: dateFilter } : {}),
      ...(search
        ? {
            OR: [
              { customerCode: { contains: search } },
              { party: { displayName: { contains: search } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.customer.count({ where }),
      this.prisma.client.customer.findMany({
        where,
        include: { party: true },
        orderBy: { customerCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      columns: CUSTOMER_LIST_COLUMNS,
      rows: rows.map((row) => ({
        customerCode: row.customerCode,
        displayName: row.party.displayName,
        customerType: row.customerType,
        creditLimit: serializeDecimal(row.creditLimit) ?? '0',
        outstandingAmount: serializeDecimal(row.outstandingAmount) ?? '0',
        isActive: row.isActive,
      })),
      pagination: buildPagination(total, page, pageSize),
    };
  }

  private async runSupplierList(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    void ctx;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const search =
      typeof params.search === 'string' ? params.search.trim() : '';
    const dateFilter = this.buildCreatedAtFilter(params);

    const where: Prisma.SupplierWhereInput = {
      deletedAt: null,
      party: { deletedAt: null },
      ...(dateFilter ? { createdAt: dateFilter } : {}),
      ...(search
        ? {
            OR: [
              { supplierCode: { contains: search } },
              { party: { displayName: { contains: search } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.supplier.count({ where }),
      this.prisma.client.supplier.findMany({
        where,
        include: { party: true },
        orderBy: { supplierCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      columns: SUPPLIER_LIST_COLUMNS,
      rows: rows.map((row) => ({
        supplierCode: row.supplierCode,
        displayName: row.party.displayName,
        supplierType: row.supplierType,
        creditLimit: serializeDecimal(row.creditLimit) ?? '0',
        outstandingAmount: serializeDecimal(row.outstandingAmount) ?? '0',
        isActive: row.isActive,
      })),
      pagination: buildPagination(total, page, pageSize),
    };
  }

  private async runCustomerOutstanding(
    params: ReportParams,
    ctx: ReportContext,
  ): Promise<ReportResult> {
    void ctx;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const search =
      typeof params.search === 'string' ? params.search.trim() : '';
    const dateFilter = this.buildCreatedAtFilter(params);

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      party: { deletedAt: null },
      outstandingAmount: { gt: 0 },
      ...(dateFilter ? { createdAt: dateFilter } : {}),
      ...(search
        ? {
            OR: [
              { customerCode: { contains: search } },
              { party: { displayName: { contains: search } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.customer.count({ where }),
      this.prisma.client.customer.findMany({
        where,
        include: { party: true },
        orderBy: { outstandingAmount: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const mappedRows = rows.map((row) => ({
      customerCode: row.customerCode,
      displayName: row.party.displayName,
      outstandingAmount: serializeDecimal(row.outstandingAmount) ?? '0',
    }));

    const grandTotal = mappedRows.reduce(
      (sum, row) => sum.add(new Prisma.Decimal(row.outstandingAmount)),
      new Prisma.Decimal(0),
    );

    return {
      columns: CUSTOMER_OUTSTANDING_COLUMNS,
      rows: mappedRows,
      totals: {
        grandTotal: serializeDecimal(grandTotal) ?? '0',
      },
      pagination: buildPagination(total, page, pageSize),
    };
  }

  private buildCreatedAtFilter(
    params: ReportParams,
  ): Prisma.BigIntFilter | undefined {
    if (!params.fromDate && !params.toDate) {
      return undefined;
    }

    return {
      ...(params.fromDate
        ? { gte: BigInt(new Date(params.fromDate).getTime()) }
        : {}),
      ...(params.toDate
        ? { lte: BigInt(this.endOfDay(params.toDate).getTime()) }
        : {}),
    };
  }

  private endOfDay(dateStr: string): Date {
    const date = new Date(dateStr);
    date.setHours(23, 59, 59, 999);

    return date;
  }
}
