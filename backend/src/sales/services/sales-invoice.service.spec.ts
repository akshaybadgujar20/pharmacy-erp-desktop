import { Test, TestingModule } from '@nestjs/testing';
import { SalesInvoiceService } from './sales-invoice.service';

describe('SalesInvoiceService', () => {
  let service: SalesInvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesInvoiceService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(SalesInvoiceService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
