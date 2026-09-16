import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { SalesReturn } from './sales-return.models';

export const SALES_RETURN_GRID_CONFIG: GridConfig<SalesReturn> = {
  id: 'sales-return-grid',
  columns: [
    { field: 'salesReturnNumber', headerName: 'Number', sortable: true, filterable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'returnReason', headerName: 'Reason', sortable: true, filterable: true },
    { field: 'returnDate', headerName: 'Date', sortable: true },
    { field: 'netAmount', headerName: 'Net Amount', type: 'currency' },
    { field: 'salesInvoiceId', headerName: 'Invoice ID', filterable: true },
    { field: 'customerId', headerName: 'Customer ID', filterable: true },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'SALES:SALES_RETURN:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'SALES:SALES_RETURN:DELETE',
      confirmation: true,
    },
  ],
};
