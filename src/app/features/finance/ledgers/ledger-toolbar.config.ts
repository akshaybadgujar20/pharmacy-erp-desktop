import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const LEDGER_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'ledger-toolbar',
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
      label: 'New Ledger',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'FINANCE:LEDGER:CREATE',
    },
  ],
};
