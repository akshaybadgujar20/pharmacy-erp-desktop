import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const STOCK_ADJUSTMENT_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'stock-adjustment-toolbar',
  layout: { direction: 'horizontal', align: 'between' },
  items: [
    { type: 'spacer' },
    {
      type: 'button',
      id: 'refresh',
      label: 'Refresh',
      icon: 'pi pi-refresh',
      variant: 'outlined',
      shortcutId: 'global.refresh',
    },
    {
      type: 'button',
      id: 'create',
      label: 'New Adjustment',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'INVENTORY:STOCK_ADJUSTMENT:CREATE',
    },
  ],
};
