import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PurchaseInvoiceItem } from './purchase-invoice-item.models';

export const PURCHASE_INVOICE_ITEM_GRID_CONFIG: GridConfig<PurchaseInvoiceItem> = {
  id: 'purchase-invoice-item-grid',
  columns: [
    { field: 'medicineId', headerName: 'Medicine ID', sortable: true, filterable: true },
    { field: 'batchId', headerName: 'Batch ID', sortable: true },
    { field: 'invoiceQuantity', headerName: 'Invoice Qty', type: 'number' },
    { field: 'unitPrice', headerName: 'Unit Price', type: 'currency' },
    { field: 'mrp', headerName: 'MRP', type: 'currency' },
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
