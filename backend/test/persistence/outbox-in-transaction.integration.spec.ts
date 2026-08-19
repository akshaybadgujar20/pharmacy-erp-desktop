import { randomUUID } from 'crypto';
import { OutboxOperation } from '../../src/persistence/outbox/outbox-operation.constants';
import { OutboxService } from '../../src/persistence/outbox/outbox.service';
import {
  TEST_DEVICE_ID,
  createPersistenceTestContext,
  loadSeededBranch,
  runWithTestContext,
} from './persistence-test.helpers';

describe('OutboxService (integration)', () => {
  let outbox: OutboxService;
  let services: Awaited<ReturnType<typeof createPersistenceTestContext>>['services'];
  let seed: Awaited<ReturnType<typeof loadSeededBranch>>;
  let moduleRef: Awaited<ReturnType<typeof createPersistenceTestContext>>['moduleRef'];

  beforeAll(async () => {
    const ctx = await createPersistenceTestContext();
    moduleRef = ctx.moduleRef;
    services = ctx.services;
    outbox = moduleRef.get(OutboxService);
    seed = await loadSeededBranch(services.prisma);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('rolls back outbox rows when the transaction fails', async () => {
    const before = await services.prisma.client.outbox.count({
      where: { deviceId: TEST_DEVICE_ID },
    });

    await expect(
      runWithTestContext(services, seed, () =>
        services.unitOfWork.run(async (tx) => {
          await outbox.enqueue(tx, {
            entityType: 'SalesInvoice',
            entityUuid: randomUUID(),
            operation: OutboxOperation.CREATE,
            payload: { test: true },
            branchId: seed.branch.id,
          });
          throw new Error('force rollback');
        }),
      ),
    ).rejects.toThrow('force rollback');

    const after = await services.prisma.client.outbox.count({
      where: { deviceId: TEST_DEVICE_ID },
    });
    expect(after).toBe(before);
  });
});

