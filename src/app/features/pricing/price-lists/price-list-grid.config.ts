import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { PriceList } from './price-list.models';

export const PRICE_LIST_GRID_CONFIG: GridConfig<PriceList> = {
  id: 'price-list-grid',
  columns: [
    { field: 'priceListCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'priceListName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'priceListType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'branchId', headerName: 'Branch ID', sortable: true, filterable: true },
    { field: 'isDefault', headerName: 'Default', type: 'boolean' },
    { field: 'isActive', headerName: 'Active', type: 'boolean' },
  ],
  row: { getId: (row) => row.id, doubleClickAction: 'edit' },
  pagination: { enabled: true, serverSide: true, pageSize: 25 },
  filtering: { enabled: true, globalSearch: true, serverSide: true },
  actions: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'pi pi-pencil',
      permission: 'PRICING:PRICE_LIST:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PRICING:PRICE_LIST:DELETE',
      confirmation: true,
    },
  ],
};
