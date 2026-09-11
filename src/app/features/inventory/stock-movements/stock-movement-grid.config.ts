import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { StockMovement } from './stock-movement.models';

export const STOCK_MOVEMENT_GRID_CONFIG: GridConfig<StockMovement> = {
  id: 'stock-movement-grid',
  columns: [
    { field: 'movementNumber', headerName: 'Movement #', sortable: true, filterable: true },
    { field: 'movementType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'movementDirection', headerName: 'Direction', sortable: true, filterable: true },
    { field: 'batchId', headerName: 'Batch ID', sortable: true, filterable: true },
    { field: 'medicineId', headerName: 'Medicine ID', sortable: true, filterable: true },
    { field: 'quantity', headerName: 'Quantity', type: 'number' },
    { field: 'unitCost', headerName: 'Unit Cost', type: 'currency' },
    { field: 'balanceAfter', headerName: 'Balance After', type: 'number' },
    { field: 'movementDate', headerName: 'Date', sortable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
};
