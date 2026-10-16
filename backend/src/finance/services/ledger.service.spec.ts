import { Test, TestingModule } from '@nestjs/testing';
import { LedgerService } from './ledger.service';

describe('LedgerService', () => {
  let service: LedgerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LedgerService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(LedgerService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
