import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  let service: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(AuditLogService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
