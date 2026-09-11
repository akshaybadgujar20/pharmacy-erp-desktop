import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const securityRoutes: Routes = [
  {
    path: 'users',
    canActivate: [permissionGuard('SECURITY:USER:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./users/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('SECURITY:USER:CREATE')],
        loadComponent: () =>
          import('./users/user-detail.component').then((m) => m.UserDetailComponent),
      },
      {
        path: ':userId/roles',
        loadComponent: () =>
          import('./users/user-detail.component').then((m) => m.UserDetailComponent),
      },
      {
        path: ':userId/branches',
        loadComponent: () =>
          import('./users/user-detail.component').then((m) => m.UserDetailComponent),
      },
      {
        path: ':userId',
        loadComponent: () =>
          import('./users/user-detail.component').then((m) => m.UserDetailComponent),
      },
    ],
  },
  {
    path: 'roles',
    canActivate: [permissionGuard('SECURITY:ROLE:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./roles/role-list.component').then((m) => m.RoleListComponent),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('SECURITY:ROLE:CREATE')],
        loadComponent: () =>
          import('./roles/role-detail.component').then((m) => m.RoleDetailComponent),
      },
      {
        path: ':roleId/permissions',
        loadComponent: () =>
          import('./roles/role-detail.component').then((m) => m.RoleDetailComponent),
      },
      {
        path: ':roleId',
        loadComponent: () =>
          import('./roles/role-detail.component').then((m) => m.RoleDetailComponent),
      },
    ],
  },
  {
    path: 'permissions',
    canActivate: [permissionGuard('SECURITY:PERMISSION:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./permissions/permission-list.component').then(
            (m) => m.PermissionListComponent,
          ),
      },
    ],
  },
  {
    path: 'user-sessions',
    canActivate: [permissionGuard('SECURITY:USER_SESSION:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./user-sessions/user-session-list.component').then(
            (m) => m.UserSessionListComponent,
          ),
      },
    ],
  },
];
