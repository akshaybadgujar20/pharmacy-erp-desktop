import { GridConfig } from '../../../components/generic/grid/types/grid.types';
import { DiscountRule } from './discount-rule.models';

export const DISCOUNT_RULE_GRID_CONFIG: GridConfig<DiscountRule> = {
  id: 'discount-rule-grid',
  columns: [
    { field: 'ruleCode', headerName: 'Code', sortable: true, filterable: true },
    { field: 'ruleName', headerName: 'Name', sortable: true, filterable: true },
    { field: 'discountType', headerName: 'Type', sortable: true, filterable: true },
    { field: 'discountValue', headerName: 'Value', sortable: true },
    { field: 'appliesTo', headerName: 'Applies To', sortable: true, filterable: true },
    { field: 'priority', headerName: 'Priority', type: 'number' },
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
      permission: 'PRICING:DISCOUNT_RULE:UPDATE',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      permission: 'PRICING:DISCOUNT_RULE:DELETE',
      confirmation: true,
    },
  ],
};
