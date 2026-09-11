import { ToolbarMenuItemConfig } from '../types/toolbar-menu-item.types';
import { ToolbarItemConfig } from '../types/toolbar-item.types';
import { ToolbarConfig } from '../types/toolbar.types';

export const DEFAULT_TOOLBAR_CONFIG: Omit<ToolbarConfig, 'items'> = {
  layout: {
    direction: 'horizontal',
    align: 'start',
    gap: '0.5rem',
    wrap: true,
  },
  appearance: {
    size: 'normal',
    compact: false,
  },
};

function cloneMenuItem(item: ToolbarMenuItemConfig): ToolbarMenuItemConfig {
  return {
    ...item,
    items: item.items?.map((child) => cloneMenuItem(child)),
  };
}

function cloneToolbarItem(item: ToolbarItemConfig): ToolbarItemConfig {
  if (item.type === 'buttonGroup') {
    return {
      ...item,
      items: item.items.map((child) => ({ ...child })),
    };
  }
  if (item.type === 'splitButton') {
    return {
      ...item,
      menuItems: item.menuItems.map((menuItem) => cloneMenuItem(menuItem)),
    };
  }
  return { ...item };
}

export function mergeToolbarConfig(config: ToolbarConfig): ToolbarConfig {
  const defaults = DEFAULT_TOOLBAR_CONFIG;
  return {
    ...defaults,
    ...config,
    layout: { ...defaults.layout, ...config.layout },
    appearance: { ...defaults.appearance, ...config.appearance },
    items: config.items.map((item) => cloneToolbarItem(item)),
  };
}
