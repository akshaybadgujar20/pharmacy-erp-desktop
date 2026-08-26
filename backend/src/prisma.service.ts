import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { createPrismaClient } from './persistence/prisma/prisma-client.factory';
import { syncPrismaIdSequenceFromDatabase } from './persistence/prisma/sync-prisma-id-sequence';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    const databasePath = databaseUrl?.startsWith('file:')
      ? databaseUrl.replace(/^file:/, '')
      : undefined;
    this.client = createPrismaClient(databasePath);
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
