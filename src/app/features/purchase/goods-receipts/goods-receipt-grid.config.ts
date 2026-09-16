import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { GoodsReceipt } from './goods-receipt.models';

export const GOODS_RECEIPT_GRID_CONFIG: GridConfig<GoodsReceipt> = {
  id: 'goods-receipt-grid',
  columns: [
    { field: 'goodsReceiptNumber', headerName: 'Number', sortable: true, filterable: true },
    { field: 'supplierId', headerName: 'Supplier ID', sortable: true, filterable: true },
    { field: 'status', headerName: 'Status', sortable: true, filterable: true },
    { field: 'receiptDate', headerName: 'Receipt Date', sortable: true },
    { field: 'supplierChallanNo', headerName: 'Challan No', filterable: true },
    { field: 'isBilled', headerName: 'Billed', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
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
