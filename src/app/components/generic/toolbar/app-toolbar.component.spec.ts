import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { AppToolbarComponent } from './app-toolbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { AppDialogService } from '../dialog/services/app-dialog.service';
import { ToolbarConfig } from './types/toolbar.types';

describe('AppToolbarComponent', () => {
  let fixture: ComponentFixture<AppToolbarComponent>;
  let component: AppToolbarComponent;

  const config: ToolbarConfig = {
    id: 'demo-toolbar',
    items: [
      {
        type: 'button',
        id: 'refresh',
        label: 'Refresh',
        icon: 'pi pi-refresh',
        shortcutId: 'global.refresh',
      },
      {
        type: 'button',
        id: 'create',
        label: 'Create',
        permission: 'PARTY:CUSTOMER:CREATE',
      },
      {
        type: 'splitButton',
        id: 'export',
        label: 'Export',
        menuItems: [{ id: 'csv', label: 'CSV' }],
      },
    ],
  };

  const authServiceMock = {
    hasPermission: jest.fn((p: string) => p === 'PARTY:CUSTOMER:CREATE'),
    hasRole: jest.fn(() => false),
    hasAnyRole: jest.fn(() => false),
  };

  const appDialogServiceMock = {
    confirm: jest.fn(() => of(true)),
    confirmPopup: jest.fn(() => of(true)),
    confirmDelete: jest.fn(() => of(true)),
    openDynamic: jest.fn(),
  };

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    await TestBed.configureTestingModule({
      imports: [AppToolbarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: AppDialogService, useValue: appDialogServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppToolbarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', config);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('merges config with defaults', () => {
    expect(component.mergedConfig().layout?.direction).toBe('horizontal');
    expect(component.mergedConfig().items).toHaveLength(3);
  });

  it('filters items by permission', () => {
    expect(component.visibleItems()).toHaveLength(3);
    const ids = component.visibleItems().map((item) =>
      item.type === 'button' || item.type === 'splitButton' ? item.id : item.type,
    );
    expect(ids).toContain('create');
    expect(ids).toContain('refresh');
    expect(ids).toContain('export');
  });

  it('emits action events for button clicks', () => {
    const emitted: unknown[] = [];
    component.action.subscribe((event) => emitted.push(event));
    component.onButtonClick({
      type: 'button',
      id: 'create',
      label: 'Create',
    });
    expect(emitted).toEqual([{ action: 'create', source: 'button', externalUrl: undefined }]);
  });

  it('emits action events for split button main click', () => {
    const emitted: unknown[] = [];
    component.action.subscribe((event) => emitted.push(event));
    component.onSplitButtonClick({
      type: 'splitButton',
      id: 'export',
      label: 'Export',
      menuItems: [],
    });
    expect(emitted).toEqual([{ action: 'export', source: 'splitButton', externalUrl: undefined }]);
  });

  it('renders shortcut chip when shortcutId is set', () => {
    fixture.detectChanges();
    const shortcut = fixture.nativeElement.querySelector('.app-toolbar__shortcut');
    expect(shortcut?.textContent?.trim()).toBe('F5');
  });

  it('includes shortcut in aria-label', () => {
    const label = component.getAriaLabel({
      type: 'button',
      id: 'refresh',
      label: 'Refresh',
      shortcutId: 'global.refresh',
    });
    expect(label).toBe('Refresh (F5)');
  });

  it('builds menu model for split button', () => {
    const model = component.getMenuModel({
      type: 'splitButton',
      id: 'export',
      label: 'Export',
      menuItems: [{ id: 'csv', label: 'CSV' }],
    });
    expect(model).toHaveLength(1);
    expect(model[0].label).toBe('CSV');
  });
});
