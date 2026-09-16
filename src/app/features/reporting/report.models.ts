import { Pagination } from '../../core/models/api-response.types';

export interface ReportDefinitionMeta {
  id: string;
  name: string;
  category: string;
  permission: string;
}

export interface ReportColumn {
  key: string;
  label: string;
  type: string;
  align?: 'left' | 'center' | 'right';
}

export interface ReportRunResult {
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
  pagination?: Pagination;
}
