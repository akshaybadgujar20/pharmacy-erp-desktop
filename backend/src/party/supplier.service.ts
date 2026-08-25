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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { toSupplierResponse } from './mappers/supplier.mapper';
import {
  assertPartyExists,
  optimisticUpdate,
  throwConflict,
  throwNotFound,
} from './utils/party.util';

@Injectable()
export class SupplierService {
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

    const where: Prisma.SupplierWhereInput = {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { supplierCode: { contains: search } },
              { gstin: { contains: search } },
              { party: { displayName: { contains: search } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.client.supplier.count({ where }),
      this.prisma.client.supplier.findMany({
        where,
        orderBy: { supplierCode: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return PaginatedResult.of(
      rows.map(toSupplierResponse),
      buildPagination(total, page, pageSize),
    );
  }

  async getById(id: bigint) {
    const supplier = await this.prisma.client.supplier.findFirst({
      where: { id, deletedAt: null },
    });

    if (!supplier) {
      throwNotFound(ErrorCode.SUPPLIER_NOT_FOUND, `Supplier not found: ${id}`, {
        id: id.toString(),
      });
    }

    return toSupplierResponse(supplier);
  }

  async create(dto: CreateSupplierDto) {
    return this.unitOfWork.run(async (tx) => {
      await assertPartyExists(tx, BigInt(dto.partyId));

      const partyId = BigInt(dto.partyId);

      const existingDetail = await tx.supplier.findFirst({
        where: { partyId, deletedAt: null },
      });

      if (existingDetail) {
        throwConflict(`Supplier already exists for party: ${partyId}`, {
          partyId: partyId.toString(),
        });
      }

      const supplier = await tx.supplier.create({
        data: {
          uuid: randomUUID(),
          partyId,
          supplierCode: dto.supplierCode,
          supplierType: dto.supplierType,
          gstin: dto.gstin,
          drugLicenseNumber: dto.drugLicenseNumber,
          panNumber: dto.panNumber,
          creditLimit: dto.creditLimit ?? '0',
          paymentTermsDays: dto.paymentTermsDays ?? 0,
          preferredSupplier: dto.preferredSupplier ?? false,
          isActive: dto.isActive ?? true,
        },
      });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.SUPPLIER,
        entityId: supplier.id,
        entityUuid: supplier.uuid,
        action: AuditAction.CREATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.SUPPLIER,
        entityUuid: supplier.uuid,
        operation: OutboxOperation.CREATE,
        payload: { uuid: supplier.uuid, supplierCode: supplier.supplierCode },
      });

      return toSupplierResponse(supplier);
    });
  }

  async update(id: bigint, dto: UpdateSupplierDto) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.supplier.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SUPPLIER_NOT_FOUND,
          `Supplier not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.supplier.updateMany({
        where: { id, version: dto.version, deletedAt: null },
        data: {
          supplierCode: dto.supplierCode,
          supplierType: dto.supplierType,
          gstin: dto.gstin,
          drugLicenseNumber: dto.drugLicenseNumber,
          panNumber: dto.panNumber,
          creditLimit: dto.creditLimit,
          paymentTermsDays: dto.paymentTermsDays,
          preferredSupplier: dto.preferredSupplier,
          isActive: dto.isActive,
          updatedBy: this.requestContext.tryGet()?.userId,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        ErrorCode.SUPPLIER_NOT_FOUND,
        `Supplier version conflict or not found: ${id}`,
        id,
      );

      const supplier = await tx.supplier.findFirstOrThrow({ where: { id } });

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.SUPPLIER,
        entityId: supplier.id,
        entityUuid: supplier.uuid,
        action: AuditAction.UPDATE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.SUPPLIER,
        entityUuid: supplier.uuid,
        operation: OutboxOperation.UPDATE,
        payload: { uuid: supplier.uuid, supplierCode: supplier.supplierCode },
      });

      return toSupplierResponse(supplier);
    });
  }

  async delete(id: bigint, version: number) {
    return this.unitOfWork.run(async (tx) => {
      const existing = await tx.supplier.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        throwNotFound(
          ErrorCode.SUPPLIER_NOT_FOUND,
          `Supplier not found: ${id}`,
          { id: id.toString() },
        );
      }

      const updateResult = await tx.supplier.updateMany({
        where: { id, version, deletedAt: null },
        data: {
          deletedAt: new Date(),
          deletedBy: this.requestContext.tryGet()?.userId,
          version: { increment: 1 },
        },
      });

      optimisticUpdate(
        updateResult,
        ErrorCode.SUPPLIER_NOT_FOUND,
        `Supplier version conflict or not found: ${id}`,
        id,
      );

      await this.auditService.log(tx, {
        entityType: OutboxEntityType.SUPPLIER,
        entityId: existing.id,
        entityUuid: existing.uuid,
        action: AuditAction.DELETE,
        module: AuditModule.PARTY,
      });

      await this.outboxService.enqueue(tx, {
        entityType: OutboxEntityType.SUPPLIER,
        entityUuid: existing.uuid,
        operation: OutboxOperation.DELETE,
        payload: { uuid: existing.uuid },
      });

      return { id: id.toString(), deleted: true };
    });
  }
}
