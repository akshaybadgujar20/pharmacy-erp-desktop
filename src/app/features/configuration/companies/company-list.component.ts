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
import { COMPANY_GRID_CONFIG } from './company-grid.config';
import { COMPANY_TOOLBAR_CONFIG } from './company-toolbar.config';
import { Company } from './company.models';
import { CompanyService } from './company.service';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './company-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListComponent implements OnInit, OnDestroy {
  private readonly companyService = inject(CompanyService);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly toolbarConfig = COMPANY_TOOLBAR_CONFIG;
  readonly gridConfig = COMPANY_GRID_CONFIG;

  readonly rows = signal<Company[]>([]);
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

  onGridAction(event: GridActionEvent<Company>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.router.navigate(['/configuration/companies', event.row.id]);
    }
    if (event.action === 'delete') {
      this.companyService.delete(event.row.id, event.row.version).subscribe({
        next: () => this.load(),
      });
    }
  }

  onRowDoubleClick(event: GridRowClickEvent<Company>): void {
    this.router.navigate(['/configuration/companies', event.row.id]);
  }

  private onNew(): void {
    this.router.navigate(['/configuration/companies/new']);
  }

  private load(): void {
    this.loading.set(true);
    this.companyService
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
