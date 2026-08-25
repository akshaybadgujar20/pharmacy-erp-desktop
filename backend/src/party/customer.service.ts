import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditAction } from '../audit/audit-action.constants';
import { AuditModule } from '../audit/audit-module.constants';
import { AuditService } from '../audit/audit.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ErrorCode } from '../common/exceptions/error-code';
import {
  buildPagination,
  PaginatedResult,
} from '../common/response/paginated-result';
import { RequestContextService } from '../persistence/context/request-context.service';
import { OutboxEntityType } from '../persistence/outbox/entity-type.constants';
import { OutboxOperation } from '../persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { toCustomerResponse } from './mappers/customer.mapper';
import {
  assertPartyExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from './utils/party.util';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitOfWork: UnitOfWorkService,
    private readonly auditService: AuditService,
    private readonly outboxService: OutboxService,
    private readonly requestContext: RequestContextService,
  ) {}

  async list(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const search = query.search?.trim();

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
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
        orderBy: { customerCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toCustomerResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const customer = await this.prisma.client.customer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!customer) {
      throwNotFound(ErrorCode.CUSTOMER_NOT_FOUND, `Customer not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toCustomerResponse(customer);
  }

  async create(dto: CreateCustomerDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertPartyExists(tx, BigInt(dto.partyId));

      const partyId = BigInt(dto.partyId);

      const existingDetail = await tx.customer.findFirst({
        where: { partyId, deletedAt: null },
      });

      if (existingDetail) {
        throwConflict(`Customer already exists for party: ${partyId}`, {
          partyId: partyId.toString(),
        });
      }

      const customer = await tx.customer.create({
        data: {
          uuid: randomUUID(),
          partyId,
          customerCode: dto.customerCode,
          customerType: dto.customerType,
          creditLimit: dto.creditLimit ?? '0',
          paymentTermsDays: dto.paymentTermsDays ?? 0,
          isTaxExempt: dto.isTaxExempt ?? false,
          isActive: dto.isActive ?? true,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.CUSTOMER,
        entityId: customer.id,
        entityUuid: customer.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.CUSTOMER,
        entityUuid: customer.uuid,
        operation: OutboxOperation.CREATE,
        payload: { uuid: customer.uuid, customerCode: customer.customerCode },
      });

      return toCustomerResponse(customer);
    });
  }

  async update(id: bigint, dto: UpdateCustomerDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.customer.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.CUSTOMER_NOT_FOUND,
          `Customer not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.customer.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          customerCode: dto.customerCode,
          customerType: dto.customerType,
          creditLimit: dto.creditLimit,
          paymentTermsDays: dto.paymentTermsDays,
          isTaxExempt: dto.isTaxExempt,
          isActive: dto.isActive,
          updatedBy: this.requestContext.tryGet()?.userId,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        ErrorCode.CUSTOMER_NOT_FOUND,
        `Customer version conflict or not found: ${id}`,
        id,
      );

      const customer = await tx.customer.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.CUSTOMER,
        entityId: customer.id,
        entityUuid: customer.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.CUSTOMER,
        entityUuid: customer.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: customer.uuid, customerCode: customer.customerCode },
      });

      return toCustomerResponse(customer);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.customer.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.CUSTOMER_NOT_FOUND,
          `Customer not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.customer.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: new Date(),
          deletedBy: this.requestContext.tryGet()?.userId,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        ErrorCode.CUSTOMER_NOT_FOUND,
        `Customer version conflict or not found: ${id}`,
        id,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.CUSTOMER,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.CUSTOMER,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }
}
