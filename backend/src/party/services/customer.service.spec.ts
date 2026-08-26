import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { CustomerType } from '../constants/party.constants';
import { CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let prisma: {
    customer: {
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
    party: { findFirst: jest.Mock };
    partyRole: { findFirst: jest.Mock; create: jest.Mock };
    customer: {
      findFirst: jest.Mock;
      create: jest.Mock;
      updateMany: jest.Mock;
      findFirstOrThrow: jest.Mock;
    };
  };

  beforeEach(async () => {
    tx = {
      party: { findFirst: jest.fn() },
      partyRole: { findFirst: jest.fn(), create: jest.fn() },
      customer: {
        findFirst: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
        findFirstOrThrow: jest.fn(),
      },
    };

    prisma = {
      customer: {
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
        CustomerService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: UnitOfWorkService, useValue: unitOfWork },
        { provide: AuditService, useValue: auditService },
        { provide: OutboxService, useValue: outboxService },
        { provide: RequestContextService, useValue: requestContext },
      ],
    }).compile();

    service = module.get(CustomerService);
  });

  it('throws CUSTOMER_NOT_FOUND when missing', async () => {
    prisma.customer.findFirst.mockResolvedValue(null);

    await expect(service.getById(42n)).rejects.toMatchObject({
      code: ErrorCode.CUSTOMER_NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it('throws CONFLICT when customer already exists for party', async () => {
    tx.party.findFirst.mockResolvedValue({ id: 1n, uuid: 'party-uuid' });
    tx.partyRole.findFirst.mockResolvedValue({ id: 10n });
    tx.customer.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 2n });

    await expect(
      service.create({
        partyId: '1',
        customerCode: 'CUST-001',
        customerType: CustomerType.RETAIL,
      }),
    ).rejects.toMatchObject({
      code: ErrorCode.CONFLICT,
      statusCode: HttpStatus.CONFLICT,
    });
  });

  it('creates customer when party exists', async () => {
    tx.party.findFirst.mockResolvedValue({ id: 1n, uuid: 'party-uuid' });
    tx.partyRole.findFirst.mockResolvedValue(null);
    tx.partyRole.create.mockResolvedValue({ id: 10n });
    tx.customer.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    tx.customer.create.mockResolvedValue({
      id: 3n,
      partyId: 1n,
      uuid: 'cust-uuid',
      customerCode: 'CUST-001',
      customerType: CustomerType.RETAIL,
      creditLimit: { toString: () => '0' },
      outstandingAmount: { toString: () => '0' },
      paymentTermsDays: 0,
      loyaltyPoints: 0,
      isTaxExempt: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      updatedBy: null,
      deletedBy: null,
      version: 1,
    });

    const result = await service.create({
      partyId: '1',
      customerCode: 'CUST-001',
      customerType: CustomerType.RETAIL,
    });

    expect(result.customerCode).toBe('CUST-001');
    expect(result.id).toBe('3');
    expect(auditService.log).toHaveBeenCalled();
    expect(outboxService.enqueue).toHaveBeenCalled();
  });
});
