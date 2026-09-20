import {
  allocateNextId,
  allocateNextIds,
  bootstrapIdSequence,
  computePeakBusinessId,
} from '../../src/persistence/prisma/id-sequence.service';
import { ID_SEQUENCE_SINGLETON_ID } from '../../src/persistence/prisma/id-sequence.constants';
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

  it('bootstrap leaves currentValue at or above peak business id', async () => {
    const peakId = await computePeakBusinessId(services.prisma.client);
    const row = await services.prisma.client.idSequence.findUnique({
      where: { id: ID_SEQUENCE_SINGLETON_ID },
    });

    expect(row).not.toBeNull();
    expect(row!.currentValue >= peakId).toBe(true);
  });

  it('bootstrapIdSequence recreates missing singleton and allocation still works', async () => {
    const peakId = await computePeakBusinessId(services.prisma.client);

    await services.prisma.client.idSequence.delete({
      where: { id: ID_SEQUENCE_SINGLETON_ID },
    });

    await bootstrapIdSequence(services.prisma.client);

    const row = await services.prisma.client.idSequence.findUniqueOrThrow({
      where: { id: ID_SEQUENCE_SINGLETON_ID },
    });
    expect(row.id).toBe(ID_SEQUENCE_SINGLETON_ID);
    expect(row.currentValue >= peakId).toBe(true);

    const before = row.currentValue;
    const nextId = await allocateNextId(services.prisma.client);
    expect(nextId).toBe(before + 1n);
  });

  it('allocateNextId returns strictly increasing ids and updates currentValue', async () => {
    const before = await services.prisma.client.idSequence.findUniqueOrThrow({
      where: { id: ID_SEQUENCE_SINGLETON_ID },
    });

    const first = await allocateNextId(services.prisma.client);
    const second = await allocateNextId(services.prisma.client);

    expect(second > first).toBe(true);
    expect(first).toBe(before.currentValue + 1n);

    const after = await services.prisma.client.idSequence.findUniqueOrThrow({
      where: { id: ID_SEQUENCE_SINGLETON_ID },
    });
    expect(after.currentValue).toBe(second);
  });

  it('allocateNextIds returns contiguous ids from one increment', async () => {
    const before = await services.prisma.client.idSequence.findUniqueOrThrow({
      where: { id: ID_SEQUENCE_SINGLETON_ID },
    });

    const ids = await allocateNextIds(services.prisma.client, 5);

    expect(ids).toHaveLength(5);
    expect(ids[0]).toBe(before.currentValue + 1n);
    expect(ids[4]).toBe(before.currentValue + 5n);

    const after = await services.prisma.client.idSequence.findUniqueOrThrow({
      where: { id: ID_SEQUENCE_SINGLETON_ID },
    });
    expect(after.currentValue).toBe(before.currentValue + 5n);
  });
});
