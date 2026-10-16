import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { LoyaltyMembershipStatus } from '../constants/loyalty.constants';
import { EnrollCustomerDto } from '../dto/enroll-customer.dto';
import { throwNotFound } from '../utils/loyalty.util';

@Injectable()
export class LoyaltyEnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async enroll(customerId: bigint, dto: EnrollCustomerDto) {
    return this.unitOfWork.run(async (tx) => {
      const program = await tx.loyaltyProgram.findFirst({
        where: { id: dto.loyaltyProgramId, deletedAt: null, isActive: true },
      });
      if (!program) {
        throwNotFound(
          ErrorCode.LOYALTY_PROGRAM_NOT_FOUND,
          `Loyalty program not found: ${dto.loyaltyProgramId}`,
          { loyaltyProgramId: dto.loyaltyProgramId.toString() },
        );
      }

      const now = BigInt(Date.now());
      const membership = await tx.customerLoyaltyMembership.upsert({
        where: {
          customerId_loyaltyProgramId: {
            customerId,
            loyaltyProgramId: dto.loyaltyProgramId,
          },
        },
        create: {
          uuid: randomUUID(),
          customerId,
          loyaltyProgramId: dto.loyaltyProgramId,
          status: LoyaltyMembershipStatus.ACTIVE,
          enrolledAt: now,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          status: LoyaltyMembershipStatus.ACTIVE,
          endedAt: null,
          updatedAt: now,
          version: { increment: 1 },
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.CUSTOMER_LOYALTY_MEMBERSHIP,
        entityId: membership.id,
        entityUuid: membership.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.LOYALTY,
      });
      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.CUSTOMER_LOYALTY_MEMBERSHIP,
        entityUuid: membership.uuid,
        operation: OutboxOperation.CREATE,
        payload: { uuid: membership.uuid, customerId: customerId.toString() },
      });

      return {
        id: membership.id.toString(),
        customerId: membership.customerId.toString(),
        loyaltyProgramId: membership.loyaltyProgramId.toString(),
        status: membership.status,
      };
    });
  }
}
