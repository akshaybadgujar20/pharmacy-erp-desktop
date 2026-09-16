import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const SALES_RETURN_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'sales-return-toolbar',
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
      label: 'New Return',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'SALES:SALES_RETURN:CREATE',
    },
  ],
};
