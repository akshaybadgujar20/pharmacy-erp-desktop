import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {

  constructor() {
    super({
      adapter: new PrismaBetterSqlite3({
        url: `file:${path.join(process.cwd(), '..', 'db', 'pharmacy.sqlite')}`,
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
