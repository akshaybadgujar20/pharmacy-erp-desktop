import { ToolbarConfig } from '../../components/generic/toolbar/types/toolbar.types';

export const LOYALTY_PROGRAM_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'loyalty-program-toolbar',
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
      label: 'New program',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'LOYALTY:LOYALTY_PROGRAM:CREATE',
    },
  ],
};
