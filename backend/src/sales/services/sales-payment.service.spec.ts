import { Test, TestingModule } from '@nestjs/testing';
import { SalesPaymentService } from './sales-payment.service';

describe('SalesPaymentService', () => {
  let service: SalesPaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesPaymentService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(SalesPaymentService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
