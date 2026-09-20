import {
  allocateNextId,
  allocateNextIds,
  bootstrapIdSequence,
  computePeakIdForTable,
} from '../../src/persistence/prisma/id-sequence.service';
import { createPersistenceTestContext } from './persistence-test.helpers';

describe('IdSequence (integration)', () => {
  let services: Awaited<
    ReturnType<typeof createPersistenceTestContext>
  >['services'];
  let moduleRef: Awaited<
    ReturnType<typeof createPersistenceTestContext>
  >['moduleRef'];

  beforeAll(async () => {
    const ctx = await createPersistenceTestContext();
    moduleRef = ctx.moduleRef;
    services = ctx.services;
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('bootstrap leaves Customer currentValue at or above peak id', async () => {
    const peakId = await computePeakIdForTable(
      services.prisma.client,
      'customer',
    );
    const row = await services.prisma.client.idSequence.findUnique({
      where: { modelName: 'Customer' },
    });

    expect(row).not.toBeNull();
    expect(row!.currentValue >= peakId).toBe(true);
  });

  it('bootstrapIdSequence recreates missing row and allocation still works', async () => {
    const peakId = await computePeakIdForTable(
      services.prisma.client,
      'customer',
    );

    await services.prisma.client.idSequence.deleteMany({
      where: { modelName: 'Customer' },
    });

    await bootstrapIdSequence(services.prisma.client);

    const row = await services.prisma.client.idSequence.findUniqueOrThrow({
      where: { modelName: 'Customer' },
    });
    expect(row.modelName).toBe('Customer');
    expect(row.currentValue >= peakId).toBe(true);

    const before = row.currentValue;
    const nextId = await allocateNextId(services.prisma.client, 'Customer');
    expect(nextId).toBe(before + 1n);
  });

  it('allocateNextId returns strictly increasing ids for same model', async () => {
    const before = await services.prisma.client.idSequence.findUniqueOrThrow({
      where: { modelName: 'Customer' },
    });

    const first = await allocateNextId(services.prisma.client, 'Customer');
    const second = await allocateNextId(services.prisma.client, 'Customer');

    expect(second > first).toBe(true);
    expect(first).toBe(before.currentValue + 1n);

    const after = await services.prisma.client.idSequence.findUniqueOrThrow({
      where: { modelName: 'Customer' },
    });
    expect(after.currentValue).toBe(second);
  });

  it('allocateNextIds returns contiguous ids from one increment', async () => {
    const before = await services.prisma.client.idSequence.findUniqueOrThrow({
      where: { modelName: 'Customer' },
    });

    const ids = await allocateNextIds(services.prisma.client, 'Customer', 5);

    expect(ids).toHaveLength(5);
    expect(ids[0]).toBe(before.currentValue + 1n);
    expect(ids[4]).toBe(before.currentValue + 5n);

    const after = await services.prisma.client.idSequence.findUniqueOrThrow({
      where: { modelName: 'Customer' },
    });
    expect(after.currentValue).toBe(before.currentValue + 5n);
  });

  it('different models maintain independent counters', async () => {
    await services.prisma.client.idSequence.deleteMany({
      where: { modelName: { in: ['Customer', 'Medicine'] } },
    });
    await bootstrapIdSequence(services.prisma.client);

    const customerId = await allocateNextId(services.prisma.client, 'Customer');
    const medicineId = await allocateNextId(services.prisma.client, 'Medicine');

    const customerPeak = await computePeakIdForTable(
      services.prisma.client,
      'customer',
    );
    const medicinePeak = await computePeakIdForTable(
      services.prisma.client,
      'medicine',
    );

    expect(customerId).toBe(customerPeak + 1n);
    expect(medicineId).toBe(medicinePeak + 1n);
  });
});
