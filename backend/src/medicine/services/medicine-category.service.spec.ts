import { Test, TestingModule } from '@nestjs/testing';
import { MedicineCategoryService } from './medicine-category.service';

describe('MedicineCategoryService', () => {
  let service: MedicineCategoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicineCategoryService],
    })
      .useMocker(() => ({}))
      .compile();

    service = module.get(MedicineCategoryService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });
});
