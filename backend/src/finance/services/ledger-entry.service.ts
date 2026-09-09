import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { PrismaService } from '../../prisma.service';
import { LedgerEntryListQueryDto } from '../dto/ledger-entry-list-query.dto';
import { toLedgerEntryResponse } from '../mappers/ledger-entry.mapper';
import { throwNotFound } from '../utils/finance.util';

@Injectable()
export class LedgerEntryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: LedgerEntryListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const ledgerId = query.ledgerId ? BigInt(query.ledgerId) : undefined;
    const voucherId = query.voucherId ? BigInt(query.voucherId) : undefined;
    const dateFrom = query.dateFrom ? BigInt(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? BigInt(query.dateTo) : undefined;

    const where: Prisma.LedgerEntryWhereInput = {
      deletedAt: null,
      ...(ledgerId ? { ledgerId } : {}),
      ...(query.voucherType ? { voucherType: query.voucherType } : {}),
      ...(voucherId ? { voucherId } : {}),
      ...(query.isPosted !== undefined ? { isPosted: query.isPosted } : {}),
      ...(dateFrom || dateTo
        ? {
            transactionDate: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { voucherNumber: { contains: search } },
              { narration: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.ledgerEntry.count({ where }),
      this.prisma.client.ledgerEntry.findMany({
        where,
        orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toLedgerEntryResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const entry = await this.prisma.client.ledgerEntry.findFirst({
      where: { id, deletedAt: null },
    });

    if (!entry) {
      throwNotFound(ErrorCode.NOT_FOUND, `Ledger entry not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toLedgerEntryResponse(entry);
  }
}
