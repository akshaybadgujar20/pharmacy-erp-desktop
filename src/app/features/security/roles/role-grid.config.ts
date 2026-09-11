import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Role } from './role.models';

export const ROLE_GRID_CONFIG: GridConfig<Role> = {
  id: 'role-grid',
  columns: [
    { field: 'roleCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'roleName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'description', headerName: 'Description', filterable: true },
    { field: 'isSystemRole', headerName: 'System Role', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'edit', label: 'Edit', icon: 'pi pi-pencil', permission: 'SECURITY:ROLE:UPDATE' },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'SECURITY:ROLE:DELETE',
      confirmation: true,
    },
  ],
};
