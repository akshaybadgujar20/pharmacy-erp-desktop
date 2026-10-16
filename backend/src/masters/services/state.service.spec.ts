import { Test, TestingModule } from '@nestjs/testing';
import { StateService } from './state.service';

describe('StateService', () => {
  let service: StateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StateService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(StateService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
