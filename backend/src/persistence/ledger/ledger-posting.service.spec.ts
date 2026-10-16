import { Test, TestingModule } from '@nestjs/testing';
import { LedgerPostingService } from './ledger-posting.service';

describe('LedgerPostingService', () => {
  let service: LedgerPostingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LedgerPostingService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(LedgerPostingService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
