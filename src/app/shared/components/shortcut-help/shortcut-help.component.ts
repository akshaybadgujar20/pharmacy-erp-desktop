import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { KeyboardShortcutService } from '../../../core/services/keyboard-shortcut.service';

@Component({
  selector: 'app-shortcut-help',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (shortcutService.helpVisible()) {
      <div class="shortcut-overlay" (click)="shortcutService.helpVisible.set(false)">
        <div class="shortcut-panel" (click)="$event.stopPropagation()">
          <h2>{{ 'keyboard.helpTitle' | translate }}</h2>
          <ul>
            @for (shortcut of shortcutService.list(); track shortcut.id) {
              <li>
                <span class="shortcut-key">{{ shortcut.label }}</span>
                <span>{{ shortcut.description | translate }}</span>
              </li>
            }
          </ul>
          <p class="hint">{{ 'keyboard.helpHint' | translate }}</p>
        </div>
      </div>
    }
  `,
  styles: `
    .shortcut-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .shortcut-panel {
      background: #fff;
      border-radius: 8px;
      padding: 1.5rem;
      min-width: 320px;
      max-width: 480px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
    }

    li {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.35rem 0;
      border-bottom: 1px solid #eee;
    }

    .shortcut-key {
      font-family: monospace;
      font-weight: 600;
    }

    .hint {
      font-size: 0.85rem;
      color: #666;
      margin: 0;
    }
  `,
})
export class ShortcutHelpComponent {
  readonly shortcutService = inject(KeyboardShortcutService);
}
