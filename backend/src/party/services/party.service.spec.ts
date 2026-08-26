import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../audit/audit.service';
import { ErrorCode } from '../../common/exceptions/error-code';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { PartyType } from '../constants/party.constants';
import { PartyService } from './party.service';

describe('PartyService', () => {
  let service: PartyService;
  let prisma: {
    party: {
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
    party: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findFirstOrThrow: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    tx = {
      party: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    prisma = {
      party: {
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
    requestContext = { tryGet: jest.fn().mockReturnValue({ userId: 99n }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartyService,
        { provide: PrismaService, useValue: { client: prisma } },
        { provide: UnitOfWorkService, useValue: unitOfWork },
        { provide: AuditService, useValue: auditService },
        { provide: OutboxService, useValue: outboxService },
        { provide: RequestContextService, useValue: requestContext },
      ],
    }).compile();

    service = module.get(PartyService);
  });

  it('lists parties with pagination', async () => {
    prisma.party.count.mockResolvedValue(1);
    prisma.party.findMany.mockResolvedValue([
      {
        id: 1n,
        uuid: 'uuid-1',
        partyType: PartyType.PERSON,
        displayName: 'Test Party',
        firstName: 'Test',
        middleName: null,
        lastName: 'Party',
        organizationName: null,
        isActive: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
        updatedBy: null,
        deletedBy: null,
        version: 1,
      },
    ]);

    const result = await service.list({ page: 1, pageSize: 20 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('1');
    expect(result.pagination.total).toBe(1);
  });

  it('throws PARTY_NOT_FOUND when party missing', async () => {
    prisma.party.findFirst.mockResolvedValue(null);

    await expect(service.getById(999n)).rejects.toMatchObject({
      code: ErrorCode.PARTY_NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it('creates party with audit and outbox', async () => {
    const created = {
      id: 10n,
      uuid: 'new-uuid',
      partyType: PartyType.ORGANIZATION,
      displayName: 'Acme Pharma',
      firstName: null,
      middleName: null,
      lastName: null,
      organizationName: 'Acme Pharma',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      updatedBy: null,
      deletedBy: null,
      version: 1,
    };

    tx.party.create.mockResolvedValue(created);

    const result = await service.create({
      partyType: PartyType.ORGANIZATION,
      displayName: 'Acme Pharma',
      organizationName: 'Acme Pharma',
    });

    expect(result.id).toBe('10');
    expect(auditService.log).toHaveBeenCalled();
    expect(outboxService.enqueue).toHaveBeenCalled();
  });

  it('throws ENTITY_VERSION_CONFLICT on stale update', async () => {
    tx.party.findFirst.mockResolvedValue({
      id: 5n,
      uuid: 'uuid-5',
      version: 2,
    });
    tx.party.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.update(5n, { version: 1, displayName: 'Updated' }),
    ).rejects.toMatchObject({
      code: ErrorCode.ENTITY_VERSION_CONFLICT,
      statusCode: HttpStatus.CONFLICT,
    });
  });
});
