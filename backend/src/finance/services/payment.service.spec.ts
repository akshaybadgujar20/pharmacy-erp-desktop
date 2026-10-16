import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PaymentService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
