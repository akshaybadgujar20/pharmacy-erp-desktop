import { Test, TestingModule } from '@nestjs/testing';
import { SyncRunService } from './sync-run.service';

describe('SyncRunService', () => {
  let service: SyncRunService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncRunService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(SyncRunService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
