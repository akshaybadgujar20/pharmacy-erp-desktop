import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { LoyaltyProgram, Prisma } from '@prisma/client';
import { AuditAction } from '../../audit/audit-action.constants';
import { AuditModule } from '../../audit/audit-module.constants';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../../common/response/paginated-result';
import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import type { TxClient } from '../../persistence/prisma/prisma-tx.type';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { CreateLoyaltyProgramDto } from '../dto/create-loyalty-program.dto';
import { LoyaltyProgramListQueryDto } from '../dto/loyalty-program-list-query.dto';
import { UpdateLoyaltyProgramDto } from '../dto/update-loyalty-program.dto';
import { toLoyaltyProgramResponse } from '../mappers/loyalty-program.mapper';
import { optimisticUpdate, throwNotFound } from '../utils/loyalty.util';

@Injectable()
export class LoyaltyProgramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
  ) {}

  async list(query: LoyaltyProgramListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.LoyaltyProgramWhereInput = { deletedAt: null };
    const [total, rows] = await Promise.all([
      this.prisma.client.loyaltyProgram.count({ where }),
      this.prisma.client.loyaltyProgram.findMany({
        where,
        orderBy: { programCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return PaginatedResult.of(
      rows.map(toLoyaltyProgramResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const program = await this.prisma.client.loyaltyProgram.findFirst({
      where: { id, deletedAt: null },
    });
    if (!program) {
      throwNotFound(
        ErrorCode.LOYALTY_PROGRAM_NOT_FOUND,
        `Loyalty program not found: ${id}`,
        { id: id.toString() },
      );
    }
    return toLoyaltyProgramResponse(program);
  }

  async create(dto: CreateLoyaltyProgramDto) {
    return this.unitOfWork.run(async (tx) => {
      const now = BigInt(Date.now());
      const program = await tx.loyaltyProgram.create({
        data: {
          uuid: randomUUID(),
          programCode: dto.programCode,
          programName: dto.programName,
          description: dto.description ?? null,
          pointsPerAmount: dto.pointsPerAmount,
          redemptionValue: dto.redemptionValue,
          minimumRedemptionPoints: dto.minimumRedemptionPoints,
          maximumRedemptionPoints: dto.maximumRedemptionPoints ?? null,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo ?? null,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        },
      });
      await this.emitChange(tx, program, AuditAction.CREATE, OutboxOperation.CREATE);
      return toLoyaltyProgramResponse(program);
    });
  }

  async update(id: bigint, dto: UpdateLoyaltyProgramDto) {
    return this.unitOfWork.run(async (tx) => {
      const updateResult = await tx.loyaltyProgram.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          programCode: dto.programCode,
          programName: dto.programName,
          description: dto.description ?? null,
          pointsPerAmount: dto.pointsPerAmount,
          redemptionValue: dto.redemptionValue,
          minimumRedemptionPoints: dto.minimumRedemptionPoints,
          maximumRedemptionPoints: dto.maximumRedemptionPoints ?? null,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo ?? null,
          isDefault: dto.isDefault ?? false,
          isActive: dto.isActive ?? true,
          updatedAt: BigInt(Date.now()),
          version: { increment: 1 },
        },
      });
      optimisticUpdate(updateResult, id, `Loyalty program version conflict: ${id}`);
      const program = await tx.loyaltyProgram.findFirstOrThrow({ where: { id } });
      await this.emitChange(tx, program, AuditAction.UPDATE, OutboxOperation.UPDATE);
      return toLoyaltyProgramResponse(program);
    });
  }

  private async emitChange(
    tx: TxClient,
    program: LoyaltyProgram,
    action: (typeof AuditAction)[keyof typeof AuditAction],
    operation: (typeof OutboxOperation)[keyof typeof OutboxOperation],
  ) {
    await this.auditService.log(tx, {
      entityType: OutboxEntityType.LOYALTY_PROGRAM,
      entityId: program.id,
      entityUuid: program.uuid,
      action,
      module: AuditModule.LOYALTY,
    });
    await this.outboxService.enqueue(tx, {
      entityType: OutboxEntityType.LOYALTY_PROGRAM,
      entityUuid: program.uuid,
      operation,
      payload: { uuid: program.uuid, programCode: program.programCode },
    });
  }
}
