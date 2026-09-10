import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { DeleteEntityQueryDto } from '../common/dto/delete-entity-query.dto';
import { CreateSettingDto } from './dto/create-setting.dto';
import { ListSettingsQueryDto } from './dto/list-settings-query.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('CONFIGURATION:APP_SETTING:READ')
  list(@Query() query: ListSettingsQueryDto) {
    return this.settingsService.listByCategory(query.category);
  }

  @Get(':key')
  @RequirePermissions('CONFIGURATION:APP_SETTING:READ')
  getByKey(@Param('key') key: string) {
    return this.settingsService.getByKey(key);
  }

  @Post()
  @RequirePermissions('CONFIGURATION:APP_SETTING:CREATE')
  create(@Body() dto: CreateSettingDto) {
    return this.settingsService.createSetting(dto);
  }

  @Put(':key')
  @RequirePermissions('CONFIGURATION:APP_SETTING:UPDATE')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.updateSetting(key, dto);
  }

  @Delete(':key')
  @RequirePermissions('CONFIGURATION:APP_SETTING:DELETE')
  delete(@Param('key') key: string, @Query() query: DeleteEntityQueryDto) {
    return this.settingsService.deleteSetting(key, query.version);
  }
}
