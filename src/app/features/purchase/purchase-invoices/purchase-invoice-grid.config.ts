import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PurchaseInvoice } from './purchase-invoice.models';

export const PURCHASE_INVOICE_GRID_CONFIG: GridConfig<PurchaseInvoice> = {
  id: 'purchase-invoice-grid',
  columns: [
    { field: 'purchaseInvoiceNumber', headerName: 'Number', sortable: true, filterable: true },
    { field: 'supplierInvoiceNumber', headerName: 'Supplier Invoice', filterable: true },
    { field: 'supplierId', headerName: 'Supplier ID', sortable: true, filterable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'paymentStatus', headerName: 'Payment Status', sortable: true },
    { field: 'invoiceDate', headerName: 'Invoice Date', sortable: true },
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
      permission: 'PURCHASE:PURCHASE_INVOICE:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PURCHASE:PURCHASE_INVOICE:DELETE',
      confirmation: true,
    },
  ],
};
