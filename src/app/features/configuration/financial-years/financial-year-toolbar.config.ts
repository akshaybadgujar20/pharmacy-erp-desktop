import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const FINANCIAL_YEAR_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'financial-year-toolbar',
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
      label: 'New Financial Year',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'CONFIGURATION:FINANCIAL_YEAR:CREATE',
    },
  ],
};
