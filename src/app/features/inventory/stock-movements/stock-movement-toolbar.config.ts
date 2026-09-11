import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const STOCK_MOVEMENT_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'stock-movement-toolbar',
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
  ],
};
