import { randomUUID } from 'crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
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
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { LoyaltyTransactionType } from '../constants/loyalty.constants';
import { CreateLoyaltyAdjustmentDto } from '../dto/create-loyalty-adjustment.dto';
import { LoyaltyTransactionListQueryDto } from '../dto/loyalty-transaction-list-query.dto';

@Injectable()
export class LoyaltyCustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
  ) {}

  async getSummary(customerId: bigint) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { id: customerId, deletedAt: null },
      select: { id: true, loyaltyPoints: true },
    });
    if (!customer) {
      throw new ApplicationException(
        ErrorCode.CUSTOMER_NOT_FOUND,
        `Customer not found: ${customerId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const membership =
      await this.prisma.client.customerLoyaltyMembership.findFirst({
        where: { customerId, status: 'ACTIVE', deletedAt: null },
        include: { loyaltyProgram: true },
      });

    return {
      customerId: customer.id.toString(),
      balancePoints: customer.loyaltyPoints,
      membership: membership
        ? {
            id: membership.id.toString(),
            loyaltyProgramId: membership.loyaltyProgramId.toString(),
            programCode: membership.loyaltyProgram.programCode,
            programName: membership.loyaltyProgram.programName,
            status: membership.status,
          }
        : null,
    };
  }

  async listTransactions(
    customerId: bigint,
    query: LoyaltyTransactionListQueryDto,
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = { customerId, deletedAt: null };
    const [total, rows] = await Promise.all([
      this.prisma.client.loyaltyTransaction.count({ where }),
      this.prisma.client.loyaltyTransaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map((row) => ({
        id: row.id.toString(),
        transactionType: row.transactionType,
        points: row.points,
        balanceAfterTransaction: row.balanceAfterTransaction,
        transactionDate: row.transactionDate.toString(),
        salesInvoiceId: row.salesInvoiceId?.toString() ?? null,
        remarks: row.remarks,
      })),
      buildPagination(total, page, pageSize),
    );
  }

  async adjust(customerId: bigint, dto: CreateLoyaltyAdjustmentDto) {
    return this.unitOfWork.run(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id: customerId, deletedAt: null },
      });
      if (!customer) {
        throw new ApplicationException(
          ErrorCode.CUSTOMER_NOT_FOUND,
          `Customer not found: ${customerId}`,
          HttpStatus.NOT_FOUND,
        );
      }

      const membership = await tx.customerLoyaltyMembership.findFirst({
        where: {
          customerId,
          loyaltyProgramId: dto.loyaltyProgramId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      });
      if (!membership) {
        throw new ApplicationException(
          ErrorCode.LOYALTY_MEMBERSHIP_NOT_FOUND,
          'Active loyalty membership not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const nextBalance = customer.loyaltyPoints + dto.pointsDelta;
      if (nextBalance < 0) {
        throw new ApplicationException(
          ErrorCode.LOYALTY_INSUFFICIENT_POINTS,
          'Adjustment would make balance negative',
          HttpStatus.CONFLICT,
        );
      }

      const now = BigInt(Date.now());
      const txn = await tx.loyaltyTransaction.create({
        data: {
          uuid: randomUUID(),
          loyaltyProgramId: dto.loyaltyProgramId,
          customerId,
          transactionNumber: `LT-ADJ-${randomUUID()}`,
          transactionType: LoyaltyTransactionType.ADJUSTMENT,
          transactionDate: now,
          points: dto.pointsDelta,
          balanceAfterTransaction: nextBalance,
          remarks: dto.remarks,
          createdAt: now,
          updatedAt: now,
        },
      });

      await tx.customer.update({
        where: { id: customerId },
        data: { loyaltyPoints: nextBalance, updatedAt: now },
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.LOYALTY_TRANSACTION,
        entityUuid: txn.uuid,
        operation: OutboxOperation.CREATE,
        operationId: txn.uuid,
        payload: { uuid: txn.uuid, points: dto.pointsDelta },
      });

      await this.auditService.log(tx, {
        module: AuditModule.LOYALTY,
        action: AuditAction.CREATE,
        entityType: OutboxEntityType.LOYALTY_TRANSACTION,
        entityId: txn.id,
        entityUuid: txn.uuid,
      });

      return {
        transactionId: txn.id.toString(),
        balancePoints: nextBalance,
      };
    });
  }
}
