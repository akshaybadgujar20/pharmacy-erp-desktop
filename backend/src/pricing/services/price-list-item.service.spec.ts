import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from '../../audit/audit.service';
import { RequestContextService } from '../../persistence/context/request-context.service';
import { OutboxService } from '../../persistence/outbox/outbox.service';
import { UnitOfWorkService } from '../../persistence/unit-of-work/unit-of-work.service';
import { PrismaService } from '../../prisma.service';
import { PriceListItemService } from './price-list-item.service';

describe('PriceListItemService', () => {
  let service: PriceListItemService;
  let unitOfWork: { run: jest.Mock };
  let auditService: { log: jest.Mock };
  let outboxService: { enqueue: jest.Mock };
  let tx: {
    priceList: { findFirst: jest.Mock };
    priceListItem: {
      findMany: jest.Mock;
      delete: jest.Mock;
      create: jest.Mock;
    };
    medicine: { findFirst: jest.Mock };
    tax: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      priceList: {
        findFirst: jest.fn().mockResolvedValue({
          id: 1n,
          uuid: 'pl-uuid',
          branchId: 2n,
        }),
      },
      priceListItem: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 10n, uuid: 'item-uuid-old' }]),
        delete: jest.fn(),
        create: jest.fn().mockResolvedValue({
          id: 11n,
          uuid: 'item-uuid-new',
          priceListId: 1n,
          medicineId: 5n,
          sellingPrice: '10',
          mrp: '12',
          minimumSellingPrice: null,
          discountPercent: null,
          taxId: null,
          effectiveFrom: 1000n,
          effectiveTo: null,
          isActive: true,
          remarks: null,
          createdAt: 1000n,
          updatedAt: 1000n,
          deletedAt: null,
          version: 1,
        }),
      },
      medicine: { findFirst: jest.fn().mockResolvedValue({ id: 5n }) },
      tax: { findFirst: jest.fn() },
    };

    unitOfWork = {
      run: jest.fn((fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
    };

    auditService = { log: jest.fn() };
    outboxService = { enqueue: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PriceListItemService,
        { provide: PrismaService, useValue: { client: {} } },
        { provide: UnitOfWorkService, useValue: unitOfWork },
        { provide: AuditService, useValue: auditService },
        { provide: OutboxService, useValue: outboxService },
        {
          provide: RequestContextService,
          useValue: {
            get: jest.fn().mockReturnValue({ companyId: 1n, branchId: 2n }),
          },
        },
      ],
    }).compile();

    service = module.get(PriceListItemService);
  });

  it('replace hard-deletes existing rows before creating new ones', async () => {
    await service.replace(1n, {
      items: [
        {
          medicineId: 5n,
          sellingPrice: '10',
          mrp: '12',
          effectiveFrom: 1000n,
        },
      ],
    });

    expect(tx.priceListItem.delete).toHaveBeenCalledWith({
      where: { id: 10n },
    });
    expect(tx.priceListItem.create).toHaveBeenCalledTimes(1);
    expect(auditService.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'DELETE' }),
    );
  });
});
