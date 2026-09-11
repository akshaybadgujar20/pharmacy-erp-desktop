import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { UserSession } from './user-session.models';

export const USER_SESSION_GRID_CONFIG: GridConfig<UserSession> = {
  id: 'user-session-grid',
  columns: [
    { field: 'userId', headerName: 'User ID', sortable: true, filterable: true },
    { field: 'branchId', headerName: 'Branch ID', sortable: true, filterable: true },
    { field: 'deviceName', headerName: 'Device', filterable: true },
    { field: 'deviceType', headerName: 'Device Type', filterable: true },
    { field: 'ipAddress', headerName: 'IP Address', filterable: true },
    { field: 'loginTime', headerName: 'Login Time', type: 'datetime' },
    { field: 'lastActivityAt', headerName: 'Last Activity', type: 'datetime' },
    { field: 'expiresAt', headerName: 'Expires At', type: 'datetime' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
    { field: 'logoutReason', headerName: 'Logout Reason', filterable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'force-logout',
      label: 'Force Logout',
      icon: 'pi pi-sign-out',
      permission: 'SECURITY:USER_SESSION:FORCE_LOGOUT',
      confirmation: true,
      visible: (row) => row.isActive,
    },
  ],
};
