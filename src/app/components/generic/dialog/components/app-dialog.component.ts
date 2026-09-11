import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  model,
  output,
  TemplateRef,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { toPrimeDialogBindings } from '../adapter/dialog-adapter';
import { mergeDialogConfig } from '../adapter/dialog-defaults';
import { DialogFooterActionEvent } from '../types/dialog-events.types';
import { DialogConfig } from '../types/dialog.types';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [NgTemplateOutlet, DialogModule, ButtonModule],
  templateUrl: './app-dialog.component.html',
  styleUrl: './app-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDialogComponent {
  config = input.required<DialogConfig>();
  visible = model(false);

  footerAction = output<DialogFooterActionEvent>();
  show = output<void>();
  hide = output<void>();

  headerTemplate = contentChild<TemplateRef<unknown>>('header');
  footerTemplate = contentChild<TemplateRef<unknown>>('footer');

  readonly mergedConfig = computed(() => mergeDialogConfig(this.config()));
  readonly bindings = computed(() => toPrimeDialogBindings(this.mergedConfig()));

  onFooterClick(buttonId: string): void {
    this.footerAction.emit({ buttonId });
  }

  onShow(): void {
    this.show.emit();
  }

  onHide(): void {
    this.hide.emit();
  }
}
