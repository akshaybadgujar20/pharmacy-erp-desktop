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
import { SEQUENCE_GENERATOR_GRID_CONFIG } from './sequence-generator-grid.config';
import { SEQUENCE_GENERATOR_TOOLBAR_CONFIG } from './sequence-generator-toolbar.config';
import { SequenceGenerator } from './sequence-generator.models';
import { SequenceGeneratorService } from './sequence-generator.service';

@Component({
  selector: 'app-sequence-generator-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './sequence-generator-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SequenceGeneratorListComponent implements OnInit, OnDestroy {
  private readonly sequenceGeneratorService = inject(SequenceGeneratorService);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly toolbarConfig = SEQUENCE_GENERATOR_TOOLBAR_CONFIG;
  readonly gridConfig = SEQUENCE_GENERATOR_GRID_CONFIG;

  readonly rows = signal<SequenceGenerator[]>([]);
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

  onGridAction(event: GridActionEvent<SequenceGenerator>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.router.navigate(['/configuration/sequence-generators', event.row.id]);
    }
    if (event.action === 'delete') {
      this.sequenceGeneratorService.delete(event.row.id, event.row.version).subscribe({
        next: () => this.load(),
      });
    }
  }

  onRowDoubleClick(event: GridRowClickEvent<SequenceGenerator>): void {
    this.router.navigate(['/configuration/sequence-generators', event.row.id]);
  }

  private onNew(): void {
    this.router.navigate(['/configuration/sequence-generators/new']);
  }

  private load(): void {
    this.loading.set(true);
    this.sequenceGeneratorService
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
