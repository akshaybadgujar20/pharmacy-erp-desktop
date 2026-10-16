import { Test, TestingModule } from '@nestjs/testing';
import { SyncLogService } from './sync-log.service';

describe('SyncLogService', () => {
  let service: SyncLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncLogService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(SyncLogService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
