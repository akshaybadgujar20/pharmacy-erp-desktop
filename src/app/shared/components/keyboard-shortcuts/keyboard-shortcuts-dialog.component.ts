import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import {
  bindingFromKeyboardEvent,
  KeyboardShortcutService,
  ShortcutViewModel,
} from '../../../core/keyboard';

@Component({
  selector: 'app-keyboard-shortcuts-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, TranslatePipe],
  templateUrl: './keyboard-shortcuts-dialog.component.html',
  styleUrl: './keyboard-shortcuts-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyboardShortcutsDialogComponent {
  readonly shortcutService = inject(KeyboardShortcutService);

  readonly capturingId = signal<string | null>(null);
  readonly conflictId = signal<string | null>(null);

  @HostListener('document:keydown', ['$event'])
  onCaptureKeyDown(event: KeyboardEvent): void {
    const id = this.capturingId();
    if (!id || !this.shortcutService.dialogVisible()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const binding = bindingFromKeyboardEvent(event);
    if (!binding) {
      return;
    }

    const result = this.shortcutService.updateBinding(id, binding);
    if (!result.ok) {
      this.conflictId.set(result.conflictId);
      return;
    }

    this.capturingId.set(null);
    this.conflictId.set(null);
  }

  startCapture(shortcut: ShortcutViewModel): void {
    this.capturingId.set(shortcut.id);
    this.conflictId.set(null);
  }

  cancelCapture(): void {
    this.capturingId.set(null);
    this.conflictId.set(null);
  }

  resetShortcut(id: string): void {
    this.shortcutService.resetBinding(id);
    if (this.capturingId() === id) {
      this.cancelCapture();
    }
  }

  resetAll(): void {
    this.shortcutService.resetAllBindings();
    this.cancelCapture();
  }

  onDialogHide(): void {
    this.shortcutService.closeDialog();
    this.cancelCapture();
  }

  categoryLabel(category: string): string {
    return `keyboard.categories.${category}`;
  }

  isCapturing(id: string): boolean {
    return this.capturingId() === id;
  }

  conflictDescription(): string {
    const id = this.conflictId();
    if (!id) {
      return '';
    }
    return this.shortcutService.getById(id)?.description ?? id;
  }
}
