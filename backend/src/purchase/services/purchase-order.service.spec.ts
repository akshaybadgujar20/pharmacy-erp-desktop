import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderService } from './purchase-order.service';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseOrderService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PurchaseOrderService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
