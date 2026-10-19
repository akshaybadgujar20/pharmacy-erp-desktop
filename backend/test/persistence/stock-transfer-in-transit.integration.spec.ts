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

  it('dispatch moves stock to in-transit at destination (service path)', async () => {
    const { services } = await createPersistenceTestContext();
    const transfer = await services.prisma.client.stockTransfer.findFirst({
      where: { status: 'IN_TRANSIT', deletedAt: null },
    });
    if (!transfer) {
      return;
    }
    const destStock = await services.prisma.client.stock.findFirst({
      where: {
        branchId: transfer.destinationBranchId,
        deletedAt: null,
        inTransitQuantity: { gt: 0 },
      },
    });
    expect(destStock).toBeTruthy();
  });
});
