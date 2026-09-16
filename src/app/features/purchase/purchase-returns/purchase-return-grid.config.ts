import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PurchaseReturn } from './purchase-return.models';

export const PURCHASE_RETURN_GRID_CONFIG: GridConfig<PurchaseReturn> = {
  id: 'purchase-return-grid',
  columns: [
    { field: 'purchaseReturnNumber', headerName: 'Number', sortable: true, filterable: true },
    { field: 'supplierId', headerName: 'Supplier ID', sortable: true, filterable: true },
    { field: 'returnType', headerName: 'Return Type', sortable: true, filterable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'returnDate', headerName: 'Return Date', sortable: true },
    { field: 'netAmount', headerName: 'Net Amount', type: 'currency' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
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
