import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const configurationRoutes: Routes = [
  {
    path: 'companies',
    canActivate: [permissionGuard('CONFIGURATION:COMPANY:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./companies/company-list.component').then(
            (m) => m.CompanyListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('CONFIGURATION:COMPANY:CREATE')],
        loadComponent: () =>
          import('./companies/company-detail.component').then(
            (m) => m.CompanyDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./companies/company-detail.component').then(
            (m) => m.CompanyDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'branches',
    canActivate: [permissionGuard('CONFIGURATION:BRANCH:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./branches/branch-list.component').then(
            (m) => m.BranchListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('CONFIGURATION:BRANCH:CREATE')],
        loadComponent: () =>
          import('./branches/branch-detail.component').then(
            (m) => m.BranchDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./branches/branch-detail.component').then(
            (m) => m.BranchDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'financial-years',
    canActivate: [permissionGuard('CONFIGURATION:FINANCIAL_YEAR:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./financial-years/financial-year-list.component').then(
            (m) => m.FinancialYearListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('CONFIGURATION:FINANCIAL_YEAR:CREATE')],
        loadComponent: () =>
          import('./financial-years/financial-year-detail.component').then(
            (m) => m.FinancialYearDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./financial-years/financial-year-detail.component').then(
            (m) => m.FinancialYearDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'sequence-generators',
    canActivate: [permissionGuard('CONFIGURATION:SEQUENCE_GENERATOR:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./sequence-generators/sequence-generator-list.component').then(
            (m) => m.SequenceGeneratorListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('CONFIGURATION:SEQUENCE_GENERATOR:CREATE')],
        loadComponent: () =>
          import('./sequence-generators/sequence-generator-detail.component').then(
            (m) => m.SequenceGeneratorDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./sequence-generators/sequence-generator-detail.component').then(
            (m) => m.SequenceGeneratorDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'barcode-configurations',
    canActivate: [permissionGuard('CONFIGURATION:BARCODE_CONFIGURATION:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./barcode-configurations/barcode-configuration-list.component').then(
            (m) => m.BarcodeConfigurationListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('CONFIGURATION:BARCODE_CONFIGURATION:CREATE')],
        loadComponent: () =>
          import('./barcode-configurations/barcode-configuration-detail.component').then(
            (m) => m.BarcodeConfigurationDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./barcode-configurations/barcode-configuration-detail.component').then(
            (m) => m.BarcodeConfigurationDetailComponent,
          ),
      },
    ],
  },
  {
    path: 'printer-configurations',
    canActivate: [permissionGuard('CONFIGURATION:PRINTER_CONFIGURATION:READ')],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./printer-configurations/printer-configuration-list.component').then(
            (m) => m.PrinterConfigurationListComponent,
          ),
      },
      {
        path: 'new',
        canActivate: [permissionGuard('CONFIGURATION:PRINTER_CONFIGURATION:CREATE')],
        loadComponent: () =>
          import('./printer-configurations/printer-configuration-detail.component').then(
            (m) => m.PrinterConfigurationDetailComponent,
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./printer-configurations/printer-configuration-detail.component').then(
            (m) => m.PrinterConfigurationDetailComponent,
          ),
      },
    ],
  },
];
