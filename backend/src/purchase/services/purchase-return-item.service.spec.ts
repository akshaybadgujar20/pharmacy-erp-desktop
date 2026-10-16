import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseReturnItemService } from './purchase-return-item.service';

describe('PurchaseReturnItemService', () => {
  let service: PurchaseReturnItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseReturnItemService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PurchaseReturnItemService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
