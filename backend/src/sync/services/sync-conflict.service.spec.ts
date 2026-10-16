import { Test, TestingModule } from '@nestjs/testing';
import { SyncConflictService } from './sync-conflict.service';

describe('SyncConflictService', () => {
  let service: SyncConflictService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SyncConflictService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(SyncConflictService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
