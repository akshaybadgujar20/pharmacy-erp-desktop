import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
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

  @Put(':key')
  @RequirePermissions('CONFIGURATION:APP_SETTING:UPDATE')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.updateSetting(key, dto.settingValue);
  }
}
