import { Component, input, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppGridComponent } from './app-grid.component';
import { AuthService } from '../../../core/services/auth.service';
import { AppDialogService } from '../dialog/services/app-dialog.service';
import { GridConfig } from './types/grid.types';

@Component({
  selector: 'ag-grid-angular',
  standalone: true,
  template: '',
})
class AgGridAngularStubComponent {
  rowData = input<unknown[]>();
  columnDefs = input<unknown[]>();
  gridOptions = input<unknown>();
  loading = input(false);
}

interface DemoRow {
  id: string;
  name: string;
}

describe('AppGridComponent', () => {
  let fixture: ComponentFixture<AppGridComponent<DemoRow>>;
  let component: AppGridComponent<DemoRow>;

  const config: GridConfig<DemoRow> = {
    columns: [
      { field: 'id', headerName: 'ID' },
      { field: 'name', headerName: 'Name' },
    ],
    row: { getId: (row) => row.id },
    toolbar: {
      enabled: true,
      search: true,
      actions: [
        { id: 'create', label: 'New', permission: 'PARTY:CUSTOMER:CREATE' },
      ],
    },
    actions: [
      { id: 'edit', label: 'Edit', permission: 'PARTY:CUSTOMER:UPDATE' },
    ],
  };

  const authServiceMock = {
    hasPermission: jest.fn(() => true),
  };

  const appDialogServiceMock = {
    confirm: jest.fn(() => of(true)),
    confirmPopup: jest.fn(() => of(true)),
    confirmDelete: jest.fn(() => of(true)),
    openDynamic: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppGridComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: AppDialogService, useValue: appDialogServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(AppGridComponent, {
        set: {
          imports: [AgGridAngularStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppGridComponent<DemoRow>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', config);
    fixture.componentRef.setInput('data', [
      { id: '1', name: 'Alpha' },
      { id: '2', name: 'Beta' },
    ]);
    authServiceMock.hasPermission.mockReturnValue(true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('merges config with defaults', () => {
    expect(component.mergedConfig().pagination?.pageSize).toBe(25);
    expect(component.mergedConfig().columns).toHaveLength(2);
  });

  it('filters toolbar actions by permission', () => {
    authServiceMock.hasPermission.mockReturnValue(false);
    expect(component.visibleToolbarActions()).toHaveLength(0);

    authServiceMock.hasPermission.mockImplementation(
      (p: string) => p === 'PARTY:CUSTOMER:CREATE',
    );
    expect(component.visibleToolbarActions()).toHaveLength(1);
  });

  it('emits pageChange for server-side pagination', () => {
    fixture.componentRef.setInput('config', {
      ...config,
      pagination: { enabled: true, serverSide: true, pageSize: 10 },
    });
    fixture.componentRef.setInput('totalRecords', 50);
    fixture.detectChanges();
    const emitted: unknown[] = [];
    component.pageChange.subscribe((event) => emitted.push(event));
    component.goToPage(2);
    expect(emitted).toEqual([{ page: 2, pageSize: 10 }]);
  });

  it('emits action events from toolbar', () => {
    const emitted: unknown[] = [];
    component.action.subscribe((event) => emitted.push(event));
    component.emitToolbarAction('refresh');
    expect(emitted).toEqual([{ action: 'refresh' }]);
  });
});
