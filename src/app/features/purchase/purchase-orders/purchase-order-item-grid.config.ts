import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PurchaseOrderItem } from './purchase-order-item.models';

export const PURCHASE_ORDER_ITEM_GRID_CONFIG: GridConfig<PurchaseOrderItem> = {
  id: 'purchase-order-item-grid',
  columns: [
    { field: 'medicineId', headerName: 'Medicine ID', sortable: true, filterable: true },
    { field: 'unitId', headerName: 'Unit ID', sortable: true },
    { field: 'orderedQuantity', headerName: 'Ordered Qty', type: 'number' },
    { field: 'receivedQuantity', headerName: 'Received Qty', type: 'number' },
    { field: 'unitPrice', headerName: 'Unit Price', type: 'currency' },
    { field: 'lineAmount', headerName: 'Line Amount', type: 'currency' },
    { field: 'isClosed', headerName: 'Closed', type: 'boolean' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'PURCHASE:PURCHASE_ORDER:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PURCHASE:PURCHASE_ORDER:DELETE',
      confirmation: true,
    },
  ],
};
