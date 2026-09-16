import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const PRICE_LIST_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'price-list-toolbar',
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
      label: 'New Price List',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'PRICING:PRICE_LIST:CREATE',
    },
  ],
};
