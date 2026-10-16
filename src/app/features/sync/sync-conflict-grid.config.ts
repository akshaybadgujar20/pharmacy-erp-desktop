import { GridConfig } from '../../components/generic/grid/types/grid.types';
import { SyncConflictRow } from './sync-conflict.service';

export const SYNC_CONFLICT_GRID_CONFIG: GridConfig<SyncConflictRow> = {
  id: 'sync-conflict-grid',
  columns: [
    { field: 'entityType', headerName: 'Entity', sortable: true, filterable: true },
    { field: 'resolutionStatus', headerName: 'Status', sortable: true, filterable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    { id: 'detail', label: 'Detail', icon: 'pi pi-eye' },
    { id: 'resolve', label: 'Resolve', icon: 'pi pi-check' },
  ],
};
