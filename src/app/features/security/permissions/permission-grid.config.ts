import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Permission } from './permission.models';

export const PERMISSION_GRID_CONFIG: GridConfig<Permission> = {
  id: 'permission-grid',
  columns: [
    { field: 'permissionCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'permissionName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'module', headerName: 'Module', sortable: true, filterable: true },
    { field: 'resource', headerName: 'Resource', sortable: true, filterable: true },
    { field: 'action', headerName: 'Action', sortable: true, filterable: true },
    { field: 'description', headerName: 'Description', filterable: true },
    { field: 'isSystemPermission', headerName: 'System', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
};
