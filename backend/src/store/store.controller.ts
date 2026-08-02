import {Body, Controller, Get, Post} from '@nestjs/common';
import {StoreService} from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  create(@Body('name') name: string) {
    return this.storeService.create(name);
  }

  @Get()
  findAll() {
    return this.storeService.findAll();
  }
}
