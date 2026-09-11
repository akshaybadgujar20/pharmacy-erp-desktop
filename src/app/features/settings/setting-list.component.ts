import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { KeyboardShortcutService } from '../../core/keyboard';
import { AppGridComponent } from '../../components/generic/grid';
import { AppToolbarComponent } from '../../components/generic/toolbar';
import {
  GridActionEvent,
  GridRowClickEvent,
} from '../../components/generic/grid/types/grid-events.types';
import { ToolbarActionEvent } from '../../components/generic/toolbar/types/toolbar-events.types';
import { SETTING_GRID_CONFIG } from './setting-grid.config';
import { SETTING_TOOLBAR_CONFIG } from './setting-toolbar.config';
import { AppSetting } from './setting.models';
import { SettingService } from './setting.service';

@Component({
  selector: 'app-setting-list',
  standalone: true,
  imports: [AppToolbarComponent, AppGridComponent],
  templateUrl: './setting-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingListComponent implements OnInit, OnDestroy {
  private readonly settingService = inject(SettingService);
  private readonly router = inject(Router);
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly toolbarConfig = SETTING_TOOLBAR_CONFIG;
  readonly gridConfig = SETTING_GRID_CONFIG;

  readonly rows = signal<AppSetting[]>([]);
  readonly loading = signal(false);

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

  onGridAction(event: GridActionEvent<AppSetting>): void {
    if (!event.row) {
      return;
    }
    if (event.action === 'edit') {
      this.router.navigate(['/settings', event.row.settingKey]);
    }
  }

  onRowDoubleClick(event: GridRowClickEvent<AppSetting>): void {
    this.router.navigate(['/settings', event.row.settingKey]);
  }

  private load(): void {
    this.loading.set(true);
    this.settingService.list().subscribe({
      next: (settings) => {
        this.rows.set(settings);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
