import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(UserService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
