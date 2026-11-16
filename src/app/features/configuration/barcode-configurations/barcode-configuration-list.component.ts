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
import { BARCODE_CONFIGURATION_GRID_CONFIG } from './barcode-configuration-grid.config';
import { BARCODE_CONFIGURATION_TOOLBAR_CONFIG } from './barcode-configuration-toolbar.config';
import { BarcodeConfiguration } from './barcode-configuration.models';
import { BarcodeConfigurationService } from './barcode-configuration.service';

@Component({
  selector: 'app-barcode-configuration-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './barcode-configuration-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarcodeConfigurationListComponent implements OnInit, OnDestroy {
  private readonly barcodeConfigurationService = inject(BarcodeConfigurationService);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(KeyboardShortcutService);
  private readonly activeSearch = inject(ActiveScreenSearchService);
  private readonly grid = viewChild(AppGridComponent);
  private listShortcutBinding?: ShortcutBinding;

  readonly toolbarConfig = BARCODE_CONFIGURATION_TOOLBAR_CONFIG;
  readonly gridConfig = BARCODE_CONFIGURATION_GRID_CONFIG;

  readonly rows = signal<BarcodeConfiguration[]>([]);
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

  onGridAction(event: GridActionEvent<BarcodeConfiguration>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.router.navigate(['/configuration/barcode-configurations', event.row.id]);
    }
    if (event.action === 'delete') {
      this.barcodeConfigurationService.delete(event.row.id, event.row.version).subscribe({
        next: () => this.load(),
      });
    }
  }

  onRowDoubleClick(event: GridRowClickEvent<BarcodeConfiguration>): void {
    this.router.navigate(['/configuration/barcode-configurations', event.row.id]);
  }

  private onNew(): void {
    this.router.navigate(['/configuration/barcode-configurations/new']);
  }

  private load(): void {
    this.loading.set(true);
    this.barcodeConfigurationService
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
