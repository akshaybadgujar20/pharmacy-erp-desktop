import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { RolePermission } from './role-permission.models';

export const ROLE_PERMISSION_GRID_CONFIG: GridConfig<RolePermission> = {
  id: 'role-permission-grid',
  columns: [
    { field: 'permissionId', headerName: 'Permission ID', sortable: true, filterable: true },
    { field: 'isGranted', headerName: 'Granted', type: 'boolean' },
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
      permission: 'SECURITY:ROLE_PERMISSION:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'SECURITY:ROLE_PERMISSION:DELETE',
      confirmation: true,
    },
  ],
};
