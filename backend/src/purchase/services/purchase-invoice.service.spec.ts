import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseInvoiceService } from './purchase-invoice.service';

describe('PurchaseInvoiceService', () => {
  let service: PurchaseInvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseInvoiceService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PurchaseInvoiceService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
