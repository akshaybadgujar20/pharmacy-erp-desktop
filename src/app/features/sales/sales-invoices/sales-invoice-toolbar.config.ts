import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const SALES_INVOICE_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'sales-invoice-toolbar',
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
      label: 'New Invoice',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'SALES:SALES_INVOICE:CREATE',
    },
  ],
};
