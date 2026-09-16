import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PriceListItem } from './price-list-item.models';

export const PRICE_LIST_ITEM_GRID_CONFIG: GridConfig<PriceListItem> = {
  id: 'price-list-item-grid',
  columns: [
    { field: 'medicineId', headerName: 'Medicine ID', sortable: true, filterable: true },
    { field: 'sellingPrice', headerName: 'Selling Price', sortable: true },
    { field: 'mrp', headerName: 'MRP', sortable: true },
    { field: 'discountPercent', headerName: 'Discount %', sortable: true },
    { field: 'taxId', headerName: 'Tax ID', sortable: true, filterable: true },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id },
  pagination: { enabled: true, serverSide: true, pageSize: 10 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'PRICING:PRICE_LIST_ITEM:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PRICING:PRICE_LIST_ITEM:DELETE',
      confirmation: true,
    },
  ],
};
