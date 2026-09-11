import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const BARCODE_CONFIGURATION_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'barcode-configuration-toolbar',
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
      label: 'New Barcode Configuration',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'CONFIGURATION:BARCODE_CONFIGURATION:CREATE',
    },
  ],
};
