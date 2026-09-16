import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { GoodsReceiptItem } from './goods-receipt-item.models';

export const GOODS_RECEIPT_ITEM_GRID_CONFIG: GridConfig<GoodsReceiptItem> = {
  id: 'goods-receipt-item-grid',
  columns: [
    { field: 'medicineId', headerName: 'Medicine ID', sortable: true, filterable: true },
    { field: 'batchNumber', headerName: 'Batch Number', filterable: true },
    { field: 'receivedQuantity', headerName: 'Received Qty', type: 'number' },
    { field: 'acceptedQuantity', headerName: 'Accepted Qty', type: 'number' },
    { field: 'purchaseRate', headerName: 'Purchase Rate', type: 'currency' },
    { field: 'inspectionStatus', headerName: 'Inspection', sortable: true },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'PURCHASE:GOODS_RECEIPT:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PURCHASE:GOODS_RECEIPT:DELETE',
      confirmation: true,
    },
  ],
};
