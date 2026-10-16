import { GridConfig } from '../../components/generic/grid/types/grid.types';
import { ChangeHistoryRow } from './change-history.service';

export const CHANGE_HISTORY_GRID_CONFIG: GridConfig<ChangeHistoryRow> = {
  id: 'change-history-grid',
  columns: [
    { field: 'changedAt', headerName: 'Changed', sortable: true },
    { field: 'entityType', headerName: 'Entity type', sortable: true, filterable: true },
    { field: 'entityId', headerName: 'Entity ID', filterable: true },
    { field: 'fieldName', headerName: 'Field', filterable: true },
    { field: 'oldValue', headerName: 'Old' },
    { field: 'newValue', headerName: 'New' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
};
