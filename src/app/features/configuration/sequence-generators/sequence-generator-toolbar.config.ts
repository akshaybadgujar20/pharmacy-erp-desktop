import { ToolbarConfig } from '../../../components/generic/toolbar/types/toolbar.types';

export const SEQUENCE_GENERATOR_TOOLBAR_CONFIG: ToolbarConfig = {
  id: 'sequence-generator-toolbar',
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
      label: 'New Sequence Generator',
      icon: 'pi pi-plus',
      severity: 'primary',
      shortcutId: 'global.new',
      permission: 'CONFIGURATION:SEQUENCE_GENERATOR:CREATE',
    },
  ],
};
