import { GridConfig } from '../../components/generic/grid/types/grid.types';
import { AuditLogRow } from './audit-log.service';

export const AUDIT_LOG_GRID_CONFIG: GridConfig<AuditLogRow> = {
  id: 'audit-log-grid',
  columns: [
    { field: 'createdAt', headerName: 'Time', sortable: true, filterable: true },
    { field: 'module', headerName: 'Module', sortable: true, filterable: true },
    { field: 'action', headerName: 'Action', sortable: true, filterable: true },
    { field: 'entityType', headerName: 'Entity', sortable: true, filterable: true },
    { field: 'summary', headerName: 'Summary', filterable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
};
