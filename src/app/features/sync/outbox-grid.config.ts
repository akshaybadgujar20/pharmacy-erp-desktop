import { GridConfig } from '../../components/generic/grid/types/grid.types';
import { OutboxRow } from './outbox-admin.service';

export const OUTBOX_GRID_CONFIG: GridConfig<OutboxRow> = {
  id: 'outbox-grid',
  columns: [
    { field: 'entityType', headerName: 'Entity', sortable: true, filterable: true },
    { field: 'syncStatus', headerName: 'Status', sortable: true, filterable: true },
    { field: 'retryCount', headerName: 'Retries', type: 'number' },
    { field: 'lastError', headerName: 'Last error', filterable: true },
    { field: 'createdAt', headerName: 'Created', sortable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [{ id: 'retry', label: 'Retry', icon: 'pi pi-refresh' }],
};
