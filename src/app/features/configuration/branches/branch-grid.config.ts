import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Branch } from './branch.models';

export const BRANCH_GRID_CONFIG: GridConfig<Branch> = {
  id: 'branch-grid',
  columns: [
    { field: 'branchCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'branchName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'displayName', headerName: 'Display Name', sortable: true, filterable: true },
    { field: 'city', headerName: 'City', filterable: true },
    { field: 'managerName', headerName: 'Manager', filterable: true },
    { field: 'isHeadOffice', headerName: 'Head Office', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'CONFIGURATION:BRANCH:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'CONFIGURATION:BRANCH:DELETE',
      confirmation: true,
    },
  ],
};
