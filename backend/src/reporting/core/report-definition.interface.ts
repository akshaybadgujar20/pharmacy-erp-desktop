import type { Pagination } from '../../common/response/api-response.types';
import type { TenantScope } from '../../persistence/context/tenant-scope.util';

export const ReportColumnTypes = {
  STRING: 'string',
  NUMBER: 'number',
  DECIMAL: 'decimal',
  DATE: 'date',
  DATETIME: 'datetime',
  BOOLEAN: 'boolean',
} as const;

export type ReportColumnType =
  (typeof ReportColumnTypes)[keyof typeof ReportColumnTypes];

export interface ReportColumn {
  key: string;
  label: string;
  type: ReportColumnType;
  align?: 'left' | 'center' | 'right';
}

export interface ReportResult {
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
  pagination?: Pagination;
}

export interface ReportContext {
  scope: TenantScope;
  userId?: bigint;
}

export interface ReportParams {
  page?: number;
  pageSize?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  branchId?: number;
  [key: string]: unknown;
}

export interface ReportDefinitionMeta {
  id: string;
  name: string;
  category: string;
  permission: string;
}

export interface ReportDefinition extends ReportDefinitionMeta {
  run(params: ReportParams, ctx: ReportContext): Promise<ReportResult>;
}
