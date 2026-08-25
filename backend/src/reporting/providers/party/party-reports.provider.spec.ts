import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ReportRegistryService } from '../../core/report-registry.service';
import { PartyReportsProvider } from './party-reports.provider';
import { PrismaService } from '../../../prisma.service';

describe('PartyReportsProvider', () => {
  let provider: PartyReportsProvider;
  let registry: ReportRegistryService;
  let prisma: {
    customer: {
      count: jest.Mock;
      findMany: jest.Mock;
      aggregate: jest.Mock;
    };
    supplier: {
      count: jest.Mock;
      findMany: jest.Mock;
    };
  };

  const ctx = {
    scope: { companyId: 1n, branchId: 2n },
    userId: 10n,
  };

  beforeEach(async () => {
    prisma = {
      customer: {
        count: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
      },
      supplier: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportRegistryService,
        PartyReportsProvider,
        { provide: PrismaService, useValue: { client: prisma } },
      ],
    }).compile();

    registry = module.get(ReportRegistryService);
    provider = module.get(PartyReportsProvider);
    provider.onModuleInit();
  });

  it('registers party report definitions', () => {
    const ids = registry.list().map((item) => item.id);

    expect(ids).toEqual([
      'party.customer-list',
      'party.supplier-list',
      'party.customer-outstanding',
    ]);
  });

  it('runs customer-list with deletedAt filter and mapped rows', async () => {
    prisma.customer.count.mockResolvedValue(1);
    prisma.customer.findMany.mockResolvedValue([
      {
        customerCode: 'C001',
        customerType: 'RETAIL',
        creditLimit: new Prisma.Decimal('5000'),
        outstandingAmount: new Prisma.Decimal('120.50'),
        isActive: true,
        party: { displayName: 'Alice Customer' },
      },
    ]);

    const definition = registry.get('party.customer-list');
    const result = await definition.run({ page: 1, pageSize: 20 }, ctx);

    expect(prisma.customer.count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        party: { deletedAt: null },
      },
    });
    expect(result.rows).toEqual([
      {
        customerCode: 'C001',
        displayName: 'Alice Customer',
        customerType: 'RETAIL',
        creditLimit: '5000',
        outstandingAmount: '120.5',
        isActive: true,
      },
    ]);
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it('runs customer-outstanding with aggregate totals', async () => {
    prisma.customer.count.mockResolvedValue(1);
    prisma.customer.findMany.mockResolvedValue([
      {
        customerCode: 'C001',
        outstandingAmount: new Prisma.Decimal('75'),
        party: { displayName: 'Alice Customer' },
      },
    ]);
    prisma.customer.aggregate.mockResolvedValue({
      _sum: { outstandingAmount: new Prisma.Decimal('75') },
    });

    const definition = registry.get('party.customer-outstanding');
    const result = await definition.run({ page: 1, pageSize: 20 }, ctx);

    expect(prisma.customer.count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        party: { deletedAt: null },
        outstandingAmount: { gt: 0 },
      },
    });
    expect(result.totals).toEqual({ grandTotal: '75' });
    expect(result.rows[0].outstandingAmount).toBe('75');
  });
});
