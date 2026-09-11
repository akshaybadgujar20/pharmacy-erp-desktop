import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { UserRole } from './user-role.models';

export const USER_ROLE_GRID_CONFIG: GridConfig<UserRole> = {
  id: 'user-role-grid',
  columns: [
    { field: 'roleId', headerName: 'Role ID', sortable: true, filterable: true },
    { field: 'assignedAt', headerName: 'Assigned At', type: 'datetime' },
    { field: 'assignedByUserId', headerName: 'Assigned By', filterable: true },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'SECURITY:USER_ROLE:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'SECURITY:USER_ROLE:DELETE',
      confirmation: true,
    },
  ],
};
