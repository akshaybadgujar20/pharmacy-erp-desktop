import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class LoyaltyExpiryService {
  constructor(private readonly prisma: PrismaService) {}

  async runExpiryJob() {
    const now = BigInt(Date.now());
    const expiredPrograms = await this.prisma.client.loyaltyProgram.count({
      where: {
        deletedAt: null,
        isActive: true,
        effectiveTo: { lt: now },
      },
    });

    const earnTransactions = await this.prisma.client.loyaltyTransaction.count({
      where: {
        deletedAt: null,
        transactionType: 'EARN',
        transactionDate: { lt: now - BigInt(365 * 24 * 60 * 60 * 1000) },
      },
    });

    return {
      expiredPrograms,
      staleEarnTransactions: earnTransactions,
      processedAt: now.toString(),
      note: 'v1 job reports counts; point write-off rules apply in reconciliation report.',
    };
  }
}
