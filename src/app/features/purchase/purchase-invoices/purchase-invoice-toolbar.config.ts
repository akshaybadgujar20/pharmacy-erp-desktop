import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const PURCHASE_INVOICE_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'purchase-invoice-toolbar',
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
      label: 'New Purchase Invoice',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'PURCHASE:PURCHASE_INVOICE:CREATE',
    },
  ],
};
