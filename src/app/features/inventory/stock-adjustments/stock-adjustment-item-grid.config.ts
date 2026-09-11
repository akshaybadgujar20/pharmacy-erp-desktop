import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { StockAdjustmentItem } from './stock-adjustment-item.models';

export const STOCK_ADJUSTMENT_ITEM_GRID_CONFIG: GridConfig<StockAdjustmentItem> = {
  id: 'stock-adjustment-item-grid',
  columns: [
    { field: 'batchId', headerName: 'Batch ID', sortable: true, filterable: true },
    { field: 'quantity', headerName: 'Quantity', type: 'number' },
    { field: 'unitCost', headerName: 'Unit Cost', type: 'currency' },
    { field: 'remarks', headerName: 'Remarks', filterable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'INVENTORY:STOCK_ADJUSTMENT:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'INVENTORY:STOCK_ADJUSTMENT:DELETE',
      confirmation: true,
    },
  ],
};
