import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const GOODS_RECEIPT_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'goods-receipt-toolbar',
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
      label: 'New Goods Receipt',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'PURCHASE:GOODS_RECEIPT:CREATE',
    },
  ],
};
