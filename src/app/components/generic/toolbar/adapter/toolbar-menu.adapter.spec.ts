import { toPrimeMenuItems } from './toolbar-menu.adapter';

describe('toolbar-menu.adapter', () => {
  it('maps menu items to PrimeNG menu model', () => {
    const events: unknown[] = [];
    const items = toPrimeMenuItems(
      [
        { id: 'csv', label: 'CSV', icon: 'pi pi-file' },
        { separator: true },
        { id: 'print', label: 'Print' },
      ],
      { hasPermission: () => true, hasAnyRole: () => true },
      'export',
      (event) => events.push(event),
    );
    expect(items).toHaveLength(3);
    expect(items[0].label).toBe('CSV');
    expect(items[1].separator).toBe(true);
    items[0].command?.({} as never);
    expect(events).toEqual([
      { action: 'csv', source: 'menu', parentId: 'export', externalUrl: undefined },
    ]);
  });

  it('maps nested menu items', () => {
    const items = toPrimeMenuItems(
      [
        {
          id: 'file',
          label: 'File',
          items: [{ id: 'new', label: 'New' }],
        },
      ],
      { hasPermission: () => true, hasAnyRole: () => true },
      'actions',
      () => undefined,
    );
    expect(items[0].items).toHaveLength(1);
    expect(items[0].items?.[0].label).toBe('New');
  });
});
