import { Test, TestingModule } from '@nestjs/testing';
import { InventoryLedgerService } from './inventory-ledger.service';

describe('InventoryLedgerService', () => {
  let service: InventoryLedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryLedgerService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(InventoryLedgerService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
