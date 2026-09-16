import { GridConfig } from '../../components/generic/grid/types/grid.types';
import { ReportDefinitionMeta } from './report.models';

export const REPORT_LIST_GRID_CONFIG: GridConfig<ReportDefinitionMeta> = {
  id: 'report-list-grid',
  columns: [
    { field: 'id', headerName: 'Report ID', sortable: true, filterable: true },
    { field: 'name', headerName: 'Name', sortable: true, filterable: true },
    { field: 'category', headerName: 'Category', sortable: true, filterable: true },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'open' },
  pagination: { enabled: false },
  filtering: { enabled: true, globalSearch: true, serverSide: false },
};
