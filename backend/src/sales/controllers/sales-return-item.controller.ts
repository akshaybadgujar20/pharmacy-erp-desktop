import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { DeleteEntityQueryDto } from '../../common/dto/delete-entity-query.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { CreateSalesReturnItemDto } from '../dto/create-sales-return-item.dto';
import { UpdateSalesReturnItemDto } from '../dto/update-sales-return-item.dto';
import { SalesReturnItemService } from '../services/sales-return-item.service';

@Controller('sales-returns/:salesReturnId/items')
export class SalesReturnItemController {
  constructor(
    private readonly salesReturnItemService: SalesReturnItemService,
  ) {}

  @Get()
  @RequirePermissions('SALES:SALES_RETURN:READ')
  list(
    @Param('salesReturnId', ParseBigIntPipe) salesReturnId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.salesReturnItemService.list(salesReturnId, query);
  }

  @Get(':id')
  @RequirePermissions('SALES:SALES_RETURN:READ')
  getById(
    @Param('salesReturnId', ParseBigIntPipe) salesReturnId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.salesReturnItemService.getById(salesReturnId, id);
  }

  @Post()
  @RequirePermissions('SALES:SALES_RETURN:UPDATE')
  create(
    @Param('salesReturnId', ParseBigIntPipe) salesReturnId: bigint,
    @Body() dto: CreateSalesReturnItemDto,
  ) {
    return this.salesReturnItemService.create(salesReturnId, dto);
  }

  @Patch(':id')
  @RequirePermissions('SALES:SALES_RETURN:UPDATE')
  update(
    @Param('salesReturnId', ParseBigIntPipe) salesReturnId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateSalesReturnItemDto,
  ) {
    return this.salesReturnItemService.update(salesReturnId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SALES:SALES_RETURN:UPDATE')
  delete(
    @Param('salesReturnId', ParseBigIntPipe) salesReturnId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.salesReturnItemService.delete(salesReturnId, id, query.version);
  }
}
