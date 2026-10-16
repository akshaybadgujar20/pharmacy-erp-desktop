import { Test, TestingModule } from '@nestjs/testing';
import { RequestContextService } from './request-context.service';

describe('RequestContextService', () => {
  let service: RequestContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestContextService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(RequestContextService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
