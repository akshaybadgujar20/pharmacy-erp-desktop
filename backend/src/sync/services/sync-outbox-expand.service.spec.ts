import { OutboxEntityType } from '../../persistence/outbox/entity-type.constants';
import { SyncOutboxExpandService } from './sync-outbox-expand.service';

describe('SyncOutboxExpandService', () => {
  const service = new SyncOutboxExpandService();

  it('returns null when entity row is missing', async () => {
    const tx = {
      country: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const result = await service.expand(
      tx as never,
      {
        entityType: OutboxEntityType.COUNTRY,
        entityUuid: 'missing-uuid',
      } as never,
    );
    expect(result).toBeNull();
  });

  it('adds branchUuid and batchUuid on Stock expand', async () => {
    const tx = {
      stock: {
        findFirst: jest.fn().mockResolvedValue({
          uuid: 'stock-1',
          version: 2n,
          branch: { uuid: 'branch-1' },
          batch: { uuid: 'batch-1' },
          availableQuantity: 10,
          reservedQuantity: 0,
          damagedQuantity: 0,
          expiredQuantity: 0,
          inTransitQuantity: 0,
          isActive: true,
        }),
      },
    };
    const result = await service.expand(
      tx as never,
      {
        entityType: OutboxEntityType.STOCK,
        entityUuid: 'stock-1',
        version: 2n,
      } as never,
    );
    expect(result?.data.branchUuid).toBe('branch-1');
    expect(result?.data.batchUuid).toBe('batch-1');
  });

  it('includes lines on PurchaseOrder expand', async () => {
    const tx = {
      purchaseOrder: {
        findFirst: jest.fn().mockResolvedValue({
          uuid: 'po-1',
          version: 1n,
          supplier: { uuid: 'sup-1' },
          branch: { uuid: 'branch-1' },
          items: [
            {
              uuid: 'poi-1',
              version: 1n,
              lineNumber: 1,
              medicine: { uuid: 'med-1' },
              unit: { uuid: 'uom-1' },
            },
          ],
        }),
      },
    };
    const result = await service.expand(
      tx as never,
      {
        entityType: OutboxEntityType.PURCHASE_ORDER,
        entityUuid: 'po-1',
        version: 1n,
      } as never,
    );
    expect(Array.isArray(result?.data.lines)).toBe(true);
    const lines = result?.data.lines as Array<Record<string, unknown>>;
    expect(lines[0].entityUuid).toBe('poi-1');
    expect(lines[0].medicineUuid).toBe('med-1');
  });
});
