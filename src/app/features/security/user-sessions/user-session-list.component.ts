import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { AppGridComponent } from '../../../components/generic/grid';
import { AppToolbarComponent } from '../../../components/generic/toolbar';
import {
  GridActionEvent,
  GridFilterChange,
  GridPageChange,
} from '../../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../../components/generic/toolbar/types/toolbar-events.types';
import { KeyboardShortcutService } from '../../../core/keyboard';
import { toListParams } from '../../../shared/utils/list-query.util';
import { USER_SESSION_GRID_CONFIG } from './user-session-grid.config';
import { UserSession } from './user-session.models';
import { USER_SESSION_TOOLBAR_CONFIG } from './user-session-toolbar.config';
import { UserSessionService } from './user-session.service';

@Component({
  selector: 'app-user-session-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './user-session-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserSessionListComponent implements OnInit, OnDestroy {
  private readonly userSessionService = inject(UserSessionService);
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly toolbarConfig = USER_SESSION_TOOLBAR_CONFIG;
  readonly gridConfig = USER_SESSION_GRID_CONFIG;

  readonly rows = signal<UserSession[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');

  ngOnInit(): void {
    this.shortcuts.registerHandler('global.refresh', () => this.load());
    this.load();
  }

  ngOnDestroy(): void {
    this.shortcuts.unregisterHandler('global.refresh');
  }

  onToolbarAction(event: ToolbarActionEvent): void {
    if (event.action === 'refresh') {
      this.load();
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

  onGridAction(event: GridActionEvent<UserSession>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'force-logout') {
      this.userSessionService.forceLogout(event.row.id).subscribe({
        next: () => this.load(),
      });
    }
  }

  private load(): void {
    this.loading.set(true);
    this.userSessionService
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
