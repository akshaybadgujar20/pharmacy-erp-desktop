import { Test, TestingModule } from '@nestjs/testing';
import { OutboxAdminService } from './outbox-admin.service';

describe('OutboxAdminService', () => {
  let service: OutboxAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutboxAdminService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(OutboxAdminService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
