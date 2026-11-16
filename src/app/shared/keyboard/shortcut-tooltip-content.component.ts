import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { KeyboardShortcutService } from '../../core/keyboard';

@Component({
  selector: 'app-shortcut-tooltip-content',
  standalone: true,
  template: `
    <span class="shortcut-tooltip">
      <span class="shortcut-tooltip__label">{{ label() }}</span>
      @if (keyLabel()) {
        <span class="shortcut-tooltip__key">{{ keyLabel() }}</span>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortcutTooltipContentComponent {
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly label = input.required<string>();
  readonly shortcutId = input<string>();

  readonly keyLabel = computed(() => {
    this.shortcuts.bindingsChanged();
    const id = this.shortcutId();
    return id ? this.shortcuts.getLabel(id) : undefined;
  });
}