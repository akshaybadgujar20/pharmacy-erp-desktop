import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('CONFIGURATION:APP_SETTING:READ')
  list(@Query('category') category?: string) {
    return this.settingsService.listByCategory(category);
  }

  @Put(':key')
  @RequirePermissions('CONFIGURATION:APP_SETTING:UPDATE')
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.updateSetting(key, dto.settingValue);
  }
}
