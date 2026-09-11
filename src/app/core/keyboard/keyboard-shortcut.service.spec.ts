import { TestBed } from '@angular/core/testing';
import { KeyboardShortcutService } from './keyboard-shortcut.service';
import { clearOverrides } from './keyboard-shortcut.storage';

describe('KeyboardShortcutService', () => {
  let service: KeyboardShortcutService;

  beforeEach(() => {
    clearOverrides();
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeyboardShortcutService);
  });

  afterEach(() => {
    clearOverrides();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns formatted labels for default bindings', () => {
    expect(service.getLabel('global.save')).toBe('Ctrl+S');
    expect(service.getLabel('global.refresh')).toBe('F5');
    expect(service.getLabel('global.cancel')).toBe('Esc');
  });

  it('registers and unregisters handlers', () => {
    const handler = jest.fn();
    service.registerHandler('global.save', handler);
    expect(service.getById('global.save')?.hasHandler).toBe(true);

    service.unregisterHandler('global.save');
    expect(service.getById('global.save')?.hasHandler).toBe(false);
  });

  it('updates binding and persists override', () => {
    const result = service.updateBinding('global.save', {
      key: 'b',
      ctrl: true,
    });

    expect(result).toEqual({ ok: true });
    expect(service.getLabel('global.save')).toBe('Ctrl+B');
    expect(service.getById('global.save')?.isOverridden).toBe(true);
    expect(service.exportBindings()['global.save']).toEqual({
      key: 'b',
      ctrl: true,
    });
  });

  it('detects binding conflicts', () => {
    const result = service.updateBinding('global.save', {
      key: 'F5',
    });

    expect(result).toEqual({ ok: false, conflictId: 'global.refresh' });
  });

  it('resets a single binding to default', () => {
    service.updateBinding('global.save', { key: 'b', ctrl: true });
    service.resetBinding('global.save');

    expect(service.getLabel('global.save')).toBe('Ctrl+S');
    expect(service.getById('global.save')?.isOverridden).toBe(false);
  });

  it('resets all bindings', () => {
    service.updateBinding('global.save', { key: 'b', ctrl: true });
    service.updateBinding('global.refresh', { key: 'F6' });
    service.resetAllBindings();

    expect(service.getLabel('global.save')).toBe('Ctrl+S');
    expect(service.getLabel('global.refresh')).toBe('F5');
    expect(service.exportBindings()).toEqual({});
  });

  it('loads remote bindings via loadBindings', () => {
    service.loadBindings({
      'global.save': { key: 'b', ctrl: true },
    });

    expect(service.getLabel('global.save')).toBe('Ctrl+B');
    expect(service.exportBindings()['global.save']).toEqual({
      key: 'b',
      ctrl: true,
    });
  });

  it('groups shortcuts by category', () => {
    const groups = service.listByCategory();
    expect(groups[0].category).toBe('global');
    expect(groups.some((group) => group.category === 'sales')).toBe(true);
  });

  it('bumps bindingsChanged when bindings update', () => {
    const before = service.bindingsChanged();
    service.updateBinding('global.save', { key: 'b', ctrl: true });
    expect(service.bindingsChanged()).toBe(before + 1);
  });
});
