import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { UserBranch } from './user-branch.models';

export const USER_BRANCH_GRID_CONFIG: GridConfig<UserBranch> = {
  id: 'user-branch-grid',
  columns: [
    { field: 'branchId', headerName: 'Branch ID', sortable: true, filterable: true },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
    { field: 'createdAt', headerName: 'Created At', type: 'datetime' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'SECURITY:USER_BRANCH:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'SECURITY:USER_BRANCH:DELETE',
      confirmation: true,
    },
  ],
};
