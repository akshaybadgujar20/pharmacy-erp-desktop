import { createPersistenceTestContext } from './persistence-test.helpers';

describe('Stock transfer in-transit (persistence)', () => {
  it('stock rows include inTransitQuantity column from schema', async () => {
    const { services } = await createPersistenceTestContext();
    const stock = await services.prisma.client.stock.findFirst({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
    });
    expect(stock).toBeTruthy();
    expect(stock!.inTransitQuantity).toBeDefined();
  });
});
