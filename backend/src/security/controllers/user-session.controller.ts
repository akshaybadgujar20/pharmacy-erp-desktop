import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { UserSessionListQueryDto } from '../dto/user-session-list-query.dto';
import { UserSessionService } from '../services/user-session.service';

@Controller('user-sessions')
export class UserSessionController {
  constructor(private readonly userSessionService: UserSessionService) {}

  @Get()
  @RequirePermissions('SECURITY:USER_SESSION:READ')
  list(@Query() query: UserSessionListQueryDto) {
    return this.userSessionService.list(query);
  }

  @Get(':id')
  @RequirePermissions('SECURITY:USER_SESSION:READ')
  getById(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.userSessionService.getById(id);
  }

  @Post(':id/force-logout')
  @RequirePermissions('SECURITY:USER_SESSION:FORCE_LOGOUT')
  forceLogout(@Param('id', ParseBigIntPipe) id: bigint) {
    return this.userSessionService.forceLogout(id);
  }
}
