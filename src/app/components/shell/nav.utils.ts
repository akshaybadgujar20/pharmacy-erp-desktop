import { AuthService } from '../../core/services/auth.service';
import { NavGroupConfig, NavItemConfig } from './nav.config';

function isNavItemVisible(item: NavItemConfig, auth: AuthService): boolean {
  if (item.subItems?.length) {
    const visibleChildren = item.subItems.filter((sub) => isNavItemVisible(sub, auth));
    return visibleChildren.length > 0;
  }

  if (item.permission && !auth.hasPermission(item.permission)) {
    return false;
  }

  return Boolean(item.route);
}

function filterNavItem(item: NavItemConfig, auth: AuthService): NavItemConfig | null {
  if (item.subItems?.length) {
    const subItems = item.subItems
      .map((sub) => filterNavItem(sub, auth))
      .filter((sub): sub is NavItemConfig => sub !== null);

    if (subItems.length === 0) {
      return null;
    }

    return { ...item, subItems };
  }

  if (!isNavItemVisible(item, auth)) {
    return null;
  }

  return item;
}

export function filterNavGroups(
  groups: NavGroupConfig[],
  auth: AuthService,
): NavGroupConfig[] {
  return groups
    .map((group) => {
      const items = group.items
        .map((item) => filterNavItem(item, auth))
        .filter((item): item is NavItemConfig => item !== null);

      if (items.length === 0) {
        return null;
      }

      return { ...group, items };
    })
    .filter((group): group is NavGroupConfig => group !== null);
}
