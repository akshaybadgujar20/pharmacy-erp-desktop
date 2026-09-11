import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const settingsRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('CONFIGURATION:APP_SETTING:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./setting-list.component').then((m) => m.SettingListComponent),
      },
      {
        path: ':key',
        loadComponent: () =>
          import('./setting-detail.component').then((m) => m.SettingDetailComponent),
      },
    ],
  },
];
