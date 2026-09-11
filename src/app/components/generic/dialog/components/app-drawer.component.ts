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
import { DrawerModule } from 'primeng/drawer';
import { toPrimeDrawerBindings } from '../adapter/dialog-adapter';
import { mergeDrawerConfig } from '../adapter/dialog-defaults';
import { DialogFooterActionEvent } from '../types/dialog-events.types';
import { DrawerConfig } from '../types/drawer.types';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [NgTemplateOutlet, DrawerModule, ButtonModule],
  templateUrl: './app-drawer.component.html',
  styleUrl: './app-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDrawerComponent {
  config = input.required<DrawerConfig>();
  visible = model(false);

  footerAction = output<DialogFooterActionEvent>();
  show = output<void>();
  hide = output<void>();

  headerTemplate = contentChild<TemplateRef<unknown>>('header');
  footerTemplate = contentChild<TemplateRef<unknown>>('footer');

  readonly mergedConfig = computed(() => mergeDrawerConfig(this.config()));
  readonly bindings = computed(() => toPrimeDrawerBindings(this.mergedConfig()));

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
