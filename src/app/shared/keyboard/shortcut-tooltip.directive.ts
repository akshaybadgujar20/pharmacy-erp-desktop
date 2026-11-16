import {
  computed,
  Directive,
  inject,
  input,
} from '@angular/core';
import { Tooltip } from 'primeng/tooltip';
import { KeyboardShortcutService } from '../../core/keyboard';
import { formatShortcutTooltipHtml } from './shortcut-tooltip.util';

@Directive({
  selector: '[appShortcutTooltip]',
  standalone: true,
  hostDirectives: [
    {
      directive: Tooltip,
      inputs: [
        'pTooltip: tooltipContent',
        'escape: tooltipEscape',
        'tooltipPosition: shortcutTooltipPosition',
        'tooltipStyleClass: shortcutTooltipStyleClass',
      ],
    },
  ],
})
export class ShortcutTooltipDirective {
  private readonly shortcuts = inject(KeyboardShortcutService);

  readonly label = input.required<string>({ alias: 'appShortcutTooltip' });
  readonly shortcutId = input<string>();
  readonly shortcutTooltipPosition = input<string>('top');

  readonly tooltipEscape = false;
  readonly shortcutTooltipStyleClass = 'app-shortcut-tooltip';

  readonly tooltipContent = computed(() => {
    this.shortcuts.bindingsChanged();
    const id = this.shortcutId();
    const key = id ? this.shortcuts.getLabel(id) : undefined;
    return formatShortcutTooltipHtml(this.label(), key);
  });
}