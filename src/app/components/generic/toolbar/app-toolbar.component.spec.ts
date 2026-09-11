import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppToolbarComponent } from './app-toolbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { ToolbarConfig } from './types/toolbar.types';

describe('AppToolbarComponent', () => {
  let fixture: ComponentFixture<AppToolbarComponent>;
  let component: AppToolbarComponent;

  const config: ToolbarConfig = {
    id: 'demo-toolbar',
    items: [
      { type: 'button', id: 'refresh', label: 'Refresh', icon: 'pi pi-refresh' },
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppToolbarComponent],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
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
