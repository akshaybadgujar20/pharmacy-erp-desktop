import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { BatchService } from './batch.service';

describe('BatchService', () => {
  let service: BatchService;
  let prisma: {
    batch: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
  };
  let unitOfWork: { run: jest.Mock };
  let auditService: { log: jest.Mock };
  let outboxService: { enqueue: jest.Mock };
  let requestContext: { tryGet: jest.Mock };
  let tx: {
    medicine: { findFirst: jest.Mock };
    batch: {
      findFirst: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      findFirstOrThrow: jest.Mock;
    };
    stock: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      medicine: { findFirst: jest.fn() },
      batch: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
      },
      stock: { findFirst: jest.fn() },
    };

    prisma = {
      batch: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    unitOfWork = {
      run: jest.fn((fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    auditService = { log: jest.fn() };
    outboxService = { enqueue: jest.fn() };
    requestContext = { tryGet: jest.fn().mockReturnValue({ userId: 1n }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: UnitOfWorkService, useValue: unitOfWork },
        { provide: AuditService, useValue: auditService },
        { provide: OutboxService, useValue: outboxService },
        { provide: RequestContextService, useValue: requestContext },
      ],
    }).compile();

    service = module.get(BatchService);
  });

  it('throws BATCH_NOT_FOUND when missing', async () => {
    prisma.batch.findFirst.mockResolvedValue(null);

    await expect(service.getById(99n)).rejects.toMatchObject({
      code: ErrorCode.BATCH_NOT_FOUND,
    });
  });

  it('creates batch when medicine exists and batch number is unique', async () => {
    tx.medicine.findFirst.mockResolvedValue({ id: 1n });
    tx.batch.findFirst.mockResolvedValue(null);
    tx.batch.create.mockResolvedValue({
      id: 10n,
      uuid: 'batch-uuid',
      medicineId: 1n,
      batchNumber: 'B001',
      manufacturingDate: null,
      expiryDate: 1000n,
      purchaseRate: new Prisma.Decimal(10),
      mrp: new Prisma.Decimal(12),
      barcode: null,
      isActive: true,
      createdAt: 1n,
      updatedAt: 1n,
      deletedAt: null,
      updatedBy: 1n,
      deletedBy: null,
      version: 1,
    });

    const result = await service.create({
      medicineId: 1n,
      batchNumber: 'B001',
      expiryDate: 1000n,
      purchaseRate: 10,
      mrp: 12,
    });

    expect(result.batchNumber).toBe('B001');
    expect(auditService.log).toHaveBeenCalled();
    expect(outboxService.enqueue).toHaveBeenCalled();
  });
});
