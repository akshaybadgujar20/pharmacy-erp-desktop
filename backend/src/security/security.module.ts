import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { PersistenceModule } from '../persistence/persistence.module';
import { PrismaModule } from '../prisma.module';
import { PermissionController } from './controllers/permission.controller';
import { RoleController } from './controllers/role.controller';
import { RolePermissionController } from './controllers/role-permission.controller';
import { UserBranchController } from './controllers/user-branch.controller';
import { UserController } from './controllers/user.controller';
import { UserRoleController } from './controllers/user-role.controller';
import { UserSessionController } from './controllers/user-session.controller';
import { PermissionService } from './services/permission.service';
import { RoleService } from './services/role.service';
import { RolePermissionService } from './services/role-permission.service';
import { UserBranchService } from './services/user-branch.service';
import { UserService } from './services/user.service';
import { UserRoleService } from './services/user-role.service';
import { UserSessionService } from './services/user-session.service';

@Module({
  imports: [PrismaModule, PersistenceModule, AuditModule, AuthModule],
  controllers: [
    PermissionController,
    RoleController,
    RolePermissionController,
    UserController,
    UserRoleController,
    UserBranchController,
    UserSessionController,
  ],
  providers: [
    PermissionService,
    RoleService,
    RolePermissionService,
    UserService,
    UserRoleService,
    UserBranchService,
    UserSessionService,
  ],
  exports: [UserService],
})
export class SecurityModule {}
