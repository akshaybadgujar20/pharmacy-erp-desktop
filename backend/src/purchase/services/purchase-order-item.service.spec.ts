import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderItemService } from './purchase-order-item.service';

describe('PurchaseOrderItemService', () => {
  let service: PurchaseOrderItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseOrderItemService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PurchaseOrderItemService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
