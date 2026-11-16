import { MenuItem } from 'primeng/api';
import { ToolbarActionEvent } from '../types/toolbar-events.types';
import { ToolbarMenuItemConfig } from '../types/toolbar-menu-item.types';
import { ToolbarAccessContext, filterMenuItems } from './toolbar-visibility';

export function toPrimeMenuItems(
  items: ToolbarMenuItemConfig[],
  access: ToolbarAccessContext,
  parentId: string,
  onMenuSelect: (event: ToolbarActionEvent) => void,
  shortcutLabel?: (shortcutId: string) => string | undefined,
): MenuItem[] {
  const visibleItems = filterMenuItems(items, access);
  return visibleItems.map((item) =>
    toPrimeMenuItem(item, parentId, onMenuSelect, shortcutLabel),
  );
}

function toPrimeMenuItem(
  item: ToolbarMenuItemConfig,
  parentId: string,
  onMenuSelect: (event: ToolbarActionEvent) => void,
  shortcutLabel?: (shortcutId: string) => string | undefined,
): MenuItem {
  if (item.separator) {
    return { separator: true };
  }
  const shortcut =
    item.shortcutId && shortcutLabel
      ? shortcutLabel(item.shortcutId)
      : undefined;
  const label =
    item.label && shortcut ? `${item.label} (${shortcut})` : item.label;

  const menuItem: MenuItem = {
    id: item.id,
    label,
    icon: item.icon,
    disabled: item.disabled,
    command: () => {
      if (!item.id) {
        return;
      }
      onMenuSelect({
        action: item.id,
        source: 'menu',
        parentId,
        externalUrl: item.externalUrl,
      });
    },
  };
  if (item.items?.length) {
    menuItem.items = item.items.map((child) =>
      toPrimeMenuItem(child, parentId, onMenuSelect, shortcutLabel),
    );
  }
  return menuItem;
}
