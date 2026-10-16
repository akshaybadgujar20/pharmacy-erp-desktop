import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(PasswordService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
