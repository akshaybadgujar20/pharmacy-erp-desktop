import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StoreModule } from './store/store.module';
import {PrismaService} from './prisma.service';
import {StoreService} from './store/store.service';
import {PrismaModule} from './prisma.module';
import { StoreController } from './store/store.controller';

@Module({
  imports: [PrismaModule, StoreModule],
  controllers: [AppController, StoreController],
  providers: [AppService, PrismaService, StoreService],
})
export class AppModule {}
