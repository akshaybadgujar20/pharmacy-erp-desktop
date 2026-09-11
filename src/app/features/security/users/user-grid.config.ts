import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { User } from './user.models';

export const USER_GRID_CONFIG: GridConfig<User> = {
  id: 'user-grid',
  columns: [
    { field: 'username', headerName: 'Username', sortable: true, filterable: true },
    { field: 'employeeId', headerName: 'Employee ID', sortable: true, filterable: true },
    { field: 'failedLoginAttempts', headerName: 'Failed Logins', type: 'number' },
    { field: 'lastLoginAt', headerName: 'Last Login', type: 'datetime' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
    { field: 'mustChangePassword', headerName: 'Must Change Password', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'SECURITY:USER:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'SECURITY:USER:DELETE',
      confirmation: true,
    },
  ],
};
