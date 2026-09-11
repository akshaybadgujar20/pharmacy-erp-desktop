import { AuthService } from '../../../../core/services/auth.service';
import { ToolbarMenuItemConfig } from '../types/toolbar-menu-item.types';
import {
  ToolbarActionItemConfig,
  ToolbarItemConfig,
} from '../types/toolbar-item.types';
import { ToolbarButtonGroupItemConfig } from '../types/toolbar-group.types';

export interface ToolbarAccessContext {
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

export function createAccessContext(auth: AuthService): ToolbarAccessContext {
  return {
    hasPermission: (permission) => auth.hasPermission(permission),
    hasAnyRole: (roles) => auth.hasAnyRole(roles),
  };
}

interface AccessControlled {
  permission?: string;
  permissions?: string[];
  anyPermission?: string[];
  role?: string;
  roles?: string[];
  visible?: boolean;
}

function passesAccessRules(
  item: AccessControlled,
  access: ToolbarAccessContext,
): boolean {
  if (item.visible === false) {
    return false;
  }
  if (item.permission && !access.hasPermission(item.permission)) {
    return false;
  }
  if (item.permissions?.length) {
    const allowed = item.permissions.every((p) => access.hasPermission(p));
    if (!allowed) {
      return false;
    }
  }
  if (item.anyPermission?.length) {
    const allowed = item.anyPermission.some((p) => access.hasPermission(p));
    if (!allowed) {
      return false;
    }
  }
  if (item.role && !access.hasAnyRole([item.role])) {
    return false;
  }
  if (item.roles?.length && !access.hasAnyRole(item.roles)) {
    return false;
  }
  return true;
}

export function isMenuItemVisible(
  item: ToolbarMenuItemConfig,
  access: ToolbarAccessContext,
): boolean {
  if (item.separator) {
    return true;
  }
  return passesAccessRules(item, access);
}

export function filterMenuItems(
  items: ToolbarMenuItemConfig[],
  access: ToolbarAccessContext,
): ToolbarMenuItemConfig[] {
  const filtered: ToolbarMenuItemConfig[] = [];
  for (const item of items) {
    if (item.separator) {
      filtered.push({ ...item });
      continue;
    }
    if (!isMenuItemVisible(item, access)) {
      continue;
    }
    const next: ToolbarMenuItemConfig = { ...item };
    if (item.items?.length) {
      next.items = filterMenuItems(item.items, access);
    }
    filtered.push(next);
  }
  return filtered;
}

export function isActionItemVisible(
  item: ToolbarActionItemConfig,
  access: ToolbarAccessContext,
): boolean {
  return passesAccessRules(item, access);
}

export function isToolbarItemVisible(
  item: ToolbarItemConfig,
  access: ToolbarAccessContext,
): boolean {
  switch (item.type) {
    case 'separator':
    case 'spacer':
      return true;
    case 'button':
    case 'splitButton':
      return isActionItemVisible(item, access);
    case 'buttonGroup': {
      const visibleChildren = filterButtonGroupItems(item, access);
      return visibleChildren.length > 0;
    }
    default:
      return true;
  }
}

function filterButtonGroupItems(
  group: ToolbarButtonGroupItemConfig,
  access: ToolbarAccessContext,
): Array<ToolbarActionItemConfig> {
  return group.items
    .filter((item) => isActionItemVisible(item, access))
    .map((item) => {
      if (item.type === 'splitButton') {
        return {
          ...item,
          menuItems: filterMenuItems(item.menuItems, access),
        };
      }
      return { ...item };
    });
}

export function filterToolbarItems(
  items: ToolbarItemConfig[],
  access: ToolbarAccessContext,
): ToolbarItemConfig[] {
  const filtered: ToolbarItemConfig[] = [];
  for (const item of items) {
    if (!isToolbarItemVisible(item, access)) {
      continue;
    }
    if (item.type === 'buttonGroup') {
      const children = filterButtonGroupItems(item, access);
      if (children.length === 0) {
        continue;
      }
      filtered.push({ ...item, items: children });
      continue;
    }
    if (item.type === 'splitButton') {
      filtered.push({
        ...item,
        menuItems: filterMenuItems(item.menuItems, access),
      });
      continue;
    }
    filtered.push({ ...item });
  }
  return filtered;
}

export function isActionItemDisabled(
  item: ToolbarActionItemConfig,
  loadingState: Record<string, boolean>,
): boolean {
  if (item.disabled) {
    return true;
  }
  return Boolean(loadingState[item.id]);
}

export function isItemLoading(
  itemId: string,
  loadingState: Record<string, boolean>,
): boolean {
  return Boolean(loadingState[itemId]);
}
