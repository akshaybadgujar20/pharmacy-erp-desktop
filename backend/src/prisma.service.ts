import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { createPrismaClient } from './persistence/prisma/prisma-client.factory';
import { syncPrismaIdSequenceFromDatabase } from './persistence/prisma/sync-prisma-id-sequence';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient;

  constructor() {
    this.client = createPrismaClient();
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
    await syncPrismaIdSequenceFromDatabase(this.client);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  $transaction<R>(
    fn: (tx: Prisma.TransactionClient) => Promise<R>,
    options?: Parameters<PrismaClient['$transaction']>[1],
  ): Promise<R> {
    return this.client.$transaction(fn, options);
  }
}
