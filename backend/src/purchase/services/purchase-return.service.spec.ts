import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseReturnService } from './purchase-return.service';

describe('PurchaseReturnService', () => {
  let service: PurchaseReturnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseReturnService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PurchaseReturnService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
