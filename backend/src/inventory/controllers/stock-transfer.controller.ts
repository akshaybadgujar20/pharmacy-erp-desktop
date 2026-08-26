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
import { CreateStockTransferDto } from '../dto/create-stock-transfer.dto';
import { UpdateStockTransferDto } from '../dto/update-stock-transfer.dto';
import { StockMovementService } from '../services/stock-movement.service';

@Controller('stocks/:stockId/transfer')
export class StockTransferController {
  constructor(private readonly partyContactService: StockMovementService) {}

  @Get()
  @RequirePermissions('PARTY:PARTY:READ')
  list(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.partyContactService.list(partyId, query);
  }

  @Get(':id')
  @RequirePermissions('PARTY:PARTY:READ')
  getById(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
  ) {
    return this.partyContactService.getById(partyId, id);
  }

  @Post()
  @RequirePermissions('PARTY:PARTY:CREATE')
  create(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Body() dto: CreateStockTransferDto,
  ) {
    return this.partyContactService.create(partyId, dto);
  }

  @Patch(':id')
  @RequirePermissions('PARTY:PARTY:UPDATE')
  update(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Body() dto: UpdateStockTransferDto,
  ) {
    return this.partyContactService.update(partyId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('PARTY:PARTY:DELETE')
  delete(
    @Param('partyId', ParseBigIntPipe) partyId: bigint,
    @Param('id', ParseBigIntPipe) id: bigint,
    @Query() query: DeleteEntityQueryDto,
  ) {
    return this.partyContactService.delete(partyId, id, query.version);
  }
}
