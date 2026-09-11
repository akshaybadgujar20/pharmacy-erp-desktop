import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Company } from './company.models';

export const COMPANY_GRID_CONFIG: GridConfig<Company> = {
  id: 'company-grid',
  columns: [
    { field: 'companyCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'companyName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'displayName', headerName: 'Display Name', sortable: true, filterable: true },
    { field: 'gstNumber', headerName: 'GST Number', filterable: true },
    { field: 'city', headerName: 'City', filterable: true },
    { field: 'isDefault', headerName: 'Default', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'CONFIGURATION:COMPANY:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'CONFIGURATION:COMPANY:DELETE',
      confirmation: true,
    },
  ],
};
