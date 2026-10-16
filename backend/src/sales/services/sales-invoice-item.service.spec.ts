import { Test, TestingModule } from '@nestjs/testing';
import { SalesInvoiceItemService } from './sales-invoice-item.service';

describe('SalesInvoiceItemService', () => {
  let service: SalesInvoiceItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesInvoiceItemService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(SalesInvoiceItemService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
