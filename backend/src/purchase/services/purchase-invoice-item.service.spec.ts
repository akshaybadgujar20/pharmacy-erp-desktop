import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseInvoiceItemService } from './purchase-invoice-item.service';

describe('PurchaseInvoiceItemService', () => {
  let service: PurchaseInvoiceItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseInvoiceItemService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PurchaseInvoiceItemService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
