import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PurchaseOrder } from './purchase-order.models';

export const PURCHASE_ORDER_GRID_CONFIG: GridConfig<PurchaseOrder> = {
  id: 'purchase-order-grid',
  columns: [
    { field: 'purchaseOrderNumber', headerName: 'Number', sortable: true, filterable: true },
    { field: 'supplierId', headerName: 'Supplier ID', sortable: true, filterable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'orderDate', headerName: 'Order Date', sortable: true },
    { field: 'netAmount', headerName: 'Net Amount', type: 'currency' },
    { field: 'remarks', headerName: 'Remarks', filterable: true },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
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
