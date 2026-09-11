import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { Stock } from './stock.models';

export const STOCK_GRID_CONFIG: GridConfig<Stock> = {
  id: 'stock-grid',
  columns: [
    { field: 'batchId', headerName: 'Batch ID', sortable: true, filterable: true },
    { field: 'branchId', headerName: 'Branch ID', sortable: true, filterable: true },
    { field: 'availableQuantity', headerName: 'Available', type: 'number' },
    { field: 'reservedQuantity', headerName: 'Reserved', type: 'number' },
    { field: 'damagedQuantity', headerName: 'Damaged', type: 'number' },
    { field: 'expiredQuantity', headerName: 'Expired', type: 'number' },
    { field: 'inTransitQuantity', headerName: 'In Transit', type: 'number' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
};
