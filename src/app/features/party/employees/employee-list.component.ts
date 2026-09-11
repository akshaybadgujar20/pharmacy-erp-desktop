import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { AppGridComponent } from '../../../components/generic/grid';
import { AppToolbarComponent } from '../../../components/generic/toolbar';
import { GridActionEvent, GridFilterChange, GridPageChange, GridRowClickEvent } from '../../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import { EMPLOYEE_GRID_CONFIG } from './employee-grid.config';
import { EMPLOYEE_TOOLBAR_CONFIG } from './employee-toolbar.config';
import { Employee } from './employee.models';
import { EmployeeService } from './employee.service';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './employee-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly toolbarConfig = EMPLOYEE_TOOLBAR_CONFIG;
  readonly gridConfig = EMPLOYEE_GRID_CONFIG;

  readonly rows = signal<Employee[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');

  ngOnInit(): void {
    this.shortcuts.registerHandler('global.refresh', () => this.load());
    this.shortcuts.registerHandler('global.new', () => this.onNew());
    this.load();
  }

  ngOnDestroy(): void {
    this.shortcuts.unregisterHandler('global.refresh');
    this.shortcuts.unregisterHandler('global.new');
  }

  onToolbarAction(event: ToolbarActionEvent): void {
    if (event.action === 'refresh') {
      this.load();
    }
    if (event.action === 'create') {
      this.onNew();
    }
  }

  onPageChange(event: GridPageChange): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onFilterChange(event: GridFilterChange): void {
    this.search.set(event.globalSearch ?? '');
    this.page.set(1);
    this.load();
  }

  onGridAction(event: GridActionEvent<Employee>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.router.navigate(['/party/employees', event.row.id]);
    }
    if (event.action === 'delete') {
      this.employeeService.delete(event.row.id, event.row.version).subscribe({
        next: () => this.load(),
      });
    }
  }

  onRowDoubleClick(event: GridRowClickEvent<Employee>): void {
    this.router.navigate(['/party/employees', event.row.id]);
  }

  private onNew(): void {
    this.router.navigate(['/party/employees/new']);
  }

  private load(): void {
    this.loading.set(true);
    this.employeeService
      .list(toListParams(this.page(), this.pageSize(), this.search()))
      .subscribe({
        next: (result) => {
          this.rows.set(result.data);
          this.totalRecords.set(result.pagination.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
