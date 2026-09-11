import {
  createAccessContext,
  filterMenuItems,
  filterToolbarItems,
  isActionItemVisible,
} from './toolbar-visibility';
import { ToolbarConfig } from '../types/toolbar.types';

describe('toolbar-visibility', () => {
  const access = {
    hasPermission: (permission: string) => permission === 'PARTY:CUSTOMER:READ',
    hasAnyRole: (roles: string[]) => roles.includes('ADMIN'),
  };

  it('hides items without required permission', () => {
    const items = filterToolbarItems(
      [
        { type: 'button', id: 'view', label: 'View', permission: 'PARTY:CUSTOMER:READ' },
        { type: 'button', id: 'create', label: 'Create', permission: 'PARTY:CUSTOMER:CREATE' },
      ],
      access,
    );
    expect(items).toHaveLength(1);
    expect(items[0].type).toBe('button');
    if (items[0].type === 'button') {
      expect(items[0].id).toBe('view');
    }
  });

  it('checks role requirements', () => {
    const visible = isActionItemVisible(
      { type: 'button', id: 'admin', label: 'Admin', roles: ['ADMIN'] },
      access,
    );
    expect(visible).toBe(true);
  });

  it('filters nested menu items by permission', () => {
    const menu = filterMenuItems(
      [
        { id: 'csv', label: 'CSV', permission: 'PARTY:CUSTOMER:READ' },
        { id: 'pdf', label: 'PDF', permission: 'PARTY:CUSTOMER:CREATE' },
        { separator: true },
        {
          id: 'nested',
          label: 'Nested',
          items: [{ id: 'child', label: 'Child', permission: 'PARTY:CUSTOMER:READ' }],
        },
      ],
      access,
    );
    expect(menu).toHaveLength(3);
    expect(menu[2].items).toHaveLength(1);
  });

  it('filters empty button groups', () => {
    const config: ToolbarConfig = {
      items: [
        {
          type: 'buttonGroup',
          id: 'group',
          items: [
            { type: 'button', id: 'hidden', label: 'Hidden', permission: 'DENIED' },
          ],
        },
      ],
    };
    const items = filterToolbarItems(config.items, access);
    expect(items).toHaveLength(0);
  });
});
