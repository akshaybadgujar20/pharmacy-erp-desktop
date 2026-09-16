import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const SALT_COMPOSITION_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'salt-composition-toolbar',
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
      label: 'New Salt Composition',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'MASTER:SALT_COMPOSITION:CREATE',
    },
  ],
};
