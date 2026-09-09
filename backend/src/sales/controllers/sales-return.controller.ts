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
import { CreateSalesReturnDto } from '../dto/create-sales-return.dto';
import { SalesWorkflowDto } from '../dto/sales-workflow.dto';
import { UpdateSalesReturnDto } from '../dto/update-sales-return.dto';
import { SalesReturnService } from '../services/sales-return.service';

@Controller('sales-returns')
export class SalesReturnController {
  constructor(private readonly salesReturnService: SalesReturnService) {}

  @Get()
  @RequirePermissions('SALES:SALES_RETURN:READ')
  list(@Query() query: PaginationQueryDto) {
    return this.salesReturnService.list(query);
  }

  @Get(':id')
  @RequirePermissions('SALES:SALES_RETURN:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.salesReturnService.getById(id);
  }

  @Post()
  @RequirePermissions('SALES:SALES_RETURN:CREATE')
  create(@Body() dto: CreateSalesReturnDto) {
    return this.salesReturnService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('SALES:SALES_RETURN:UPDATE')
  update(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateSalesReturnDto,
  ) {
    return this.salesReturnService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('SALES:SALES_RETURN:DELETE')
  delete(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.salesReturnService.delete(id, query.version);
  }

  @Post(':id/approve')
  @RequirePermissions('SALES:SALES_RETURN:APPROVE')
  approve(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: SalesWorkflowDto,
  ) {
    return this.salesReturnService.approve(id, dto);
  }

  @Post(':id/cancel')
  @RequirePermissions('SALES:SALES_RETURN:CANCEL')
  cancel(
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: SalesWorkflowDto,
  ) {
    return this.salesReturnService.cancel(id, dto);
  }
}
