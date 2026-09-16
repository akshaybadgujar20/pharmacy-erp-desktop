import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PurchaseReturnItem } from './purchase-return-item.models';

export const PURCHASE_RETURN_ITEM_GRID_CONFIG: GridConfig<PurchaseReturnItem> = {
  id: 'purchase-return-item-grid',
  columns: [
    { field: 'medicineId', headerName: 'Medicine ID', sortable: true, filterable: true },
    { field: 'batchId', headerName: 'Batch ID', sortable: true },
    { field: 'returnQuantity', headerName: 'Return Qty', type: 'number' },
    { field: 'unitPrice', headerName: 'Unit Price', type: 'currency' },
    { field: 'lineAmount', headerName: 'Line Amount', type: 'currency' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'PURCHASE:PURCHASE_RETURN:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PURCHASE:PURCHASE_RETURN:DELETE',
      confirmation: true,
    },
  ],
};
