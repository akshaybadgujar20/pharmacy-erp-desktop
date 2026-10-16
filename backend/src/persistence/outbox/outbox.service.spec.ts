import { Test, TestingModule } from '@nestjs/testing';
import { OutboxService } from './outbox.service';

describe('OutboxService', () => {
  let service: OutboxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutboxService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(OutboxService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
