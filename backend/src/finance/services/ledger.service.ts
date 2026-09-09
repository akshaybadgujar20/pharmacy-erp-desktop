import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ApplicationException } from '../../common/exceptions/application.exception';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { CreateLedgerDto } from '../dto/create-ledger.dto';
import { LedgerListQueryDto } from '../dto/ledger-list-query.dto';
import { UpdateLedgerDto } from '../dto/update-ledger.dto';
import { toLedgerResponse } from '../mappers/ledger.mapper';
import {
  assertLedgerExists,
  assertNoCircularLedgerParent,
  optimisticUpdate,
  throwNotFound,
} from '../utils/finance.util';

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: LedgerListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();
    const parentLedgerId = query.parentLedgerId
      ? BigInt(query.parentLedgerId)
      : undefined;

    const where: Prisma.LedgerWhereInput = {
      deletedAt: null,
      ...(query.ledgerType ? { ledgerType: query.ledgerType } : {}),
      ...(parentLedgerId !== undefined ? { parentLedgerId } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(search
        ? {
            OR: [
              { ledgerCode: { contains: search } },
              { ledgerName: { contains: search } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.ledger.count({ where }),
      this.prisma.client.ledger.findMany({
        where,
        orderBy: { ledgerCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toLedgerResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const ledger = await this.prisma.client.ledger.findFirst({
      where: { id, deletedAt: null },
    });

    if (!ledger) {
      throwNotFound(ErrorCode.LEDGER_NOT_FOUND, `Ledger not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toLedgerResponse(ledger);
  }

  async create(dto: CreateLedgerDto) {
    return this.unitOfWork.run(async (tx) => {
      if (dto.parentLedgerId) {
        await assertLedgerExists(tx, dto.parentLedgerId);
      }

      const existing = await tx.ledger.findFirst({
        where: { ledgerCode: dto.ledgerCode, deletedAt: null },
      });

      if (existing) {
        throw new ApplicationException(
          ErrorCode.CONFLICT,
          `Ledger code already exists: ${dto.ledgerCode}`,
          HttpStatus.CONFLICT,
          { ledgerCode: dto.ledgerCode },
        );
      }

      const now = BigInt(Date.now());
      const ledger = await tx.ledger.create({
        data: {
          uuid: randomUUID(),
          ledgerCode: dto.ledgerCode,
          ledgerName: dto.ledgerName,
          ledgerType: dto.ledgerType,
          parentLedgerId: dto.parentLedgerId,
          normalBalance: dto.normalBalance,
          isSystem: false,
          isActive: dto.isActive ?? true,
          description: dto.description,
          createdAt: now,
          updatedAt: now,
        },
      });

      await this.emitChange(
        tx,
        ledger,
        AuditAction.CREATE,
        OutboxOperation.CREATE,
      );
      return toLedgerResponse(ledger);
    });
  }

  async update(id: bigint, dto: UpdateLedgerDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.ledger.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.LEDGER_NOT_FOUND, `Ledger not found: ${id}`, {
          id: id.toString(),
        });
      }

      if (dto.ledgerCode && dto.ledgerCode !== existing.ledgerCode) {
        const duplicate = await tx.ledger.findFirst({
          where: { ledgerCode: dto.ledgerCode, deletedAt: null, NOT: { id } },
        });
        if (duplicate) {
          throw new ApplicationException(
            ErrorCode.CONFLICT,
            `Ledger code already exists: ${dto.ledgerCode}`,
            HttpStatus.CONFLICT,
            { ledgerCode: dto.ledgerCode },
          );
        }
      }

      if (dto.parentLedgerId !== undefined) {
        if (dto.parentLedgerId != null) {
          await assertLedgerExists(tx, dto.parentLedgerId);
          await assertNoCircularLedgerParent(tx, id, dto.parentLedgerId);
        }
      }

      const updateResult = await tx.ledger.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          ledgerCode: dto.ledgerCode,
          ledgerName: dto.ledgerName,
          ledgerType: dto.ledgerType,
          parentLedgerId: dto.parentLedgerId,
          normalBalance: dto.normalBalance,
          isActive: dto.isActive,
          description: dto.description,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(updateResult, id, `Ledger version conflict: ${id}`);

      const ledger = await tx.ledger.findFirstOrThrow({ where: { id } });
      await this.emitChange(
        tx,
        ledger,
        AuditAction.UPDATE,
        OutboxOperation.UPDATE,
      );
      return toLedgerResponse(ledger);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.ledger.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(ErrorCode.LEDGER_NOT_FOUND, `Ledger not found: ${id}`, {
          id: id.toString(),
        });
      }

      if (existing.isSystem) {
        throw new ApplicationException(
          ErrorCode.LEDGER_IS_SYSTEM,
          'System ledgers cannot be deleted',
          HttpStatus.CONFLICT,
          { id: id.toString() },
        );
      }

      const childCount = await tx.ledger.count({
        where: { parentLedgerId: id, deletedAt: null },
      });

      if (childCount > 0) {
        throw new ApplicationException(
          ErrorCode.LEDGER_HAS_CHILDREN,
          'Ledger with child accounts cannot be deleted',
          HttpStatus.CONFLICT,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.ledger.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });

      optimisticUpdate(updateResult, id, `Ledger version conflict: ${id}`);

      await this.emitChange(
        tx,
        existing,
        AuditAction.DELETE,
        OutboxOperation.DELETE,
      );
      return { id: id.toString(), deleted: true };
    });
  }

  private async emitChange(
    tx: Prisma.TransactionClient,
    ledger: { id: bigint; uuid: string; isActive?: boolean },
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.LEDGER,
      entityId: ledger.id,
      entityUuid: ledger.uuid,
      action,
      module: AuditModule.FINANCE,
    });

    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.LEDGER,
      entityUuid: ledger.uuid,
      operation,
      payload: { uuid: ledger.uuid, isActive: ledger.isActive },
    });
  }
}
