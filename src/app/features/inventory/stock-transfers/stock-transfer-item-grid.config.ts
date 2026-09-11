import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { StockTransferItem } from './stock-transfer-item.models';

export const STOCK_TRANSFER_ITEM_GRID_CONFIG: GridConfig<StockTransferItem> = {
  id: 'stock-transfer-item-grid',
  columns: [
    { field: 'batchId', headerName: 'Batch ID', sortable: true, filterable: true },
    { field: 'sentQuantity', headerName: 'Sent Qty', type: 'number' },
    { field: 'receivedQuantity', headerName: 'Received Qty', type: 'number' },
    { field: 'damagedQuantity', headerName: 'Damaged Qty', type: 'number' },
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
      permission: 'INVENTORY:STOCK_TRANSFER:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'INVENTORY:STOCK_TRANSFER:DELETE',
      confirmation: true,
    },
  ],
};
