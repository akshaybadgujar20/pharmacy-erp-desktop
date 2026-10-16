import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const loyaltyRoutes: Routes = [
  {
    path: 'programs',
    canActivate: [permissionGuard('LOYALTY:LOYALTY_PROGRAM:READ')],
    loadComponent: () =>
      import('./loyalty-program-list.component').then(
        (m) => m.LoyaltyProgramListComponent,
      ),
  },
];
