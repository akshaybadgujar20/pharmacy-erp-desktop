import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const STOCK_TRANSFER_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'stock-transfer-toolbar',
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
      label: 'New Transfer',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'INVENTORY:STOCK_TRANSFER:CREATE',
    },
  ],
};
