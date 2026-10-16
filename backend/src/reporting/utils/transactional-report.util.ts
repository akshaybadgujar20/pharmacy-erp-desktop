import { Prisma } from '@prisma/client';
import { serializeDecimal } from '../../party/utils/party.util';
import type { ReportContext, ReportParams } from '../core/report-definition.interface';

export function resolveReportBranchId(
  params: ReportParams,
  ctx: ReportContext,
): bigint {
  return params.branchId ?? ctx.scope.branchId;
}

export function epochRangeFromParams(params: ReportParams): {
  fromEpoch?: bigint;
  toEpoch?: bigint;
} {
  const fromEpoch = params.fromDate
    ? BigInt(new Date(params.fromDate).getTime())
    : undefined;
  const toEpoch = params.toDate
    ? BigInt(new Date(params.toDate).getTime() + 86_399_999)
    : undefined;
  return { fromEpoch, toEpoch };
}

export function invoiceDateFilter(
  params: ReportParams,
): Prisma.SalesInvoiceWhereInput {
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

export function decimalCell(value: Prisma.Decimal | number | string): string {
  if (value instanceof Prisma.Decimal) {
    const n = serializeDecimal(value);
    return n == null ? '0' : String(n);
  }
  return String(value);
}
