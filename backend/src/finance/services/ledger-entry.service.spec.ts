import { Test, TestingModule } from '@nestjs/testing';
import { LedgerEntryService } from './ledger-entry.service';

describe('LedgerEntryService', () => {
  let service: LedgerEntryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LedgerEntryService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(LedgerEntryService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
