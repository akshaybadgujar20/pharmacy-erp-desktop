import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/shell/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'party',
        loadChildren: () =>
          import('./features/party/party.routes').then((m) => m.partyRoutes),
      },
      {
        path: 'configuration',
        loadChildren: () =>
          import('./features/configuration/configuration.routes').then(
            (m) => m.configurationRoutes,
          ),
      },
      {
        path: 'finance',
        loadChildren: () =>
          import('./features/finance/finance.routes').then((m) => m.financeRoutes),
      },
      {
        path: 'inventory',
        loadChildren: () =>
          import('./features/inventory/inventory.routes').then((m) => m.inventoryRoutes),
      },
      {
        path: 'security',
        loadChildren: () =>
          import('./features/security/security.routes').then((m) => m.securityRoutes),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
      },
      {
        path: 'masters',
        loadChildren: () =>
          import('./features/masters/masters.routes').then((m) => m.mastersRoutes),
      },
      {
        path: 'medicine',
        loadChildren: () =>
          import('./features/medicine/medicine.routes').then((m) => m.medicineRoutes),
      },
      {
        path: 'pricing',
        loadChildren: () =>
          import('./features/pricing/pricing.routes').then((m) => m.pricingRoutes),
      },
      {
        path: 'purchase',
        loadChildren: () =>
          import('./features/purchase/purchase.routes').then((m) => m.purchaseRoutes),
      },
      {
        path: 'sales',
        loadChildren: () =>
          import('./features/sales/sales.routes').then((m) => m.salesRoutes),
      },
      {
        path: 'prescriptions',
        loadChildren: () =>
          import('./features/prescription/prescription.routes').then(
            (m) => m.prescriptionRoutes,
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reporting/reporting.routes').then((m) => m.reportingRoutes),
      },
    ],
  },
];
