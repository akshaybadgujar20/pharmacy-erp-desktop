import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, viewChild } from '@angular/core';

import { Router } from '@angular/router';
import {
  bindListScreenShortcuts,
  KeyboardShortcutService,
  type ShortcutBinding,
} from '../../../core/keyboard';
import { ActiveScreenSearchService } from '../../../core/services/active-screen-search.service';

import { AppGridComponent } from '../../../components/generic/grid';
import { AppToolbarComponent } from '../../../components/generic/toolbar';
import { GridActionEvent, GridFilterChange, GridPageChange, GridRowClickEvent } from '../../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { toListParams } from '../../../shared/utils/list-query.util';
import { COUNTRY_GRID_CONFIG } from './country-grid.config';
import { COUNTRY_TOOLBAR_CONFIG } from './country-toolbar.config';
import { Country } from './country.models';
import { CountryService } from './country.service';

@Component({
  selector: 'app-country-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './country-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountryListComponent implements OnInit, OnDestroy {
  private readonly countryService = inject(CountryService);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSearch = inject(ActiveScreenSearchService);
  private readonly grid = viewChild(AppGridComponent);
  private listShortcutBinding?: ShortcutBinding;

  readonly toolbarConfig = COUNTRY_TOOLBAR_CONFIG;
  readonly gridConfig = COUNTRY_GRID_CONFIG;

  readonly rows = signal<Country[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');

  ngOnInit(): void {
    this.listShortcutBinding = bindListScreenShortcuts(this.shortcuts, this.activeSearch, {
      refresh: () => this.load(),
      create: () => this.onNew(),
      focusSearch: () => this.grid()?.focusSearch(),
    });
    this.load();
  }

  ngOnDestroy(): void {
    this.listShortcutBinding?.unregister();
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

  onGridAction(event: GridActionEvent<Country>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.router.navigate(['/masters/countries', event.row.id]);
    }
    if (event.action === 'delete') {
      this.countryService.delete(event.row.id, event.row.version).subscribe({
        next: () => this.load(),
      });
    }
  }

  onRowDoubleClick(event: GridRowClickEvent<Country>): void {
    this.router.navigate(['/masters/countries', event.row.id]);
  }

  private onNew(): void {
    this.router.navigate(['/masters/countries/new']);
  }

  private load(): void {
    this.loading.set(true);
    this.countryService
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
