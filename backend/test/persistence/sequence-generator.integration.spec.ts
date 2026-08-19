import { DocumentType } from '../../src/persistence/sequence/document-type.constants';
import { SequenceGeneratorService } from '../../src/persistence/sequence/sequence-generator.service';
import {
  createPersistenceTestContext,
  loadSeededBranch,
  runWithTestContext,
} from './persistence-test.helpers';

describe('SequenceGeneratorService (integration)', () => {
  let sequenceGenerator: SequenceGeneratorService;
  let services: Awaited<ReturnType<typeof createPersistenceTestContext>>['services'];
  let seed: Awaited<ReturnType<typeof loadSeededBranch>>;
  let moduleRef: Awaited<ReturnType<typeof createPersistenceTestContext>>['moduleRef'];

  beforeAll(async () => {
    const ctx = await createPersistenceTestContext();
    moduleRef = ctx.moduleRef;
    services = ctx.services;
    sequenceGenerator = moduleRef.get(SequenceGeneratorService);
    seed = await loadSeededBranch(services.prisma);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('returns monotonically increasing sequence values', async () => {
    const results = await runWithTestContext(services, seed, () =>
      services.unitOfWork.run(async (tx) => {
        const first = await sequenceGenerator.next(tx, {
          companyId: seed.company.id,
          branchId: seed.branch.id,
          documentType: DocumentType.SALES_INVOICE,
          branchCode: seed.branch.branchCode,
        });
        const second = await sequenceGenerator.next(tx, {
          companyId: seed.company.id,
          branchId: seed.branch.id,
          documentType: DocumentType.SALES_INVOICE,
          branchCode: seed.branch.branchCode,
        });
        return [first, second];
      }),
    );

    expect(results[1]!.sequenceValue > results[0]!.sequenceValue).toBe(true);
    expect(results[0]!.documentNumber).toContain(seed.branch.branchCode);
  });
});

