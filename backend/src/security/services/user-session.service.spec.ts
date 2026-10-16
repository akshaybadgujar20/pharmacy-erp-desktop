import { Test, TestingModule } from '@nestjs/testing';
import { UserSessionService } from './user-session.service';

describe('UserSessionService', () => {
  let service: UserSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserSessionService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(UserSessionService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
