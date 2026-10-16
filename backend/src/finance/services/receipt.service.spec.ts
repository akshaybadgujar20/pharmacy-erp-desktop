import { Test, TestingModule } from '@nestjs/testing';
import { ReceiptService } from './receipt.service';

describe('ReceiptService', () => {
  let service: ReceiptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReceiptService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(ReceiptService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
