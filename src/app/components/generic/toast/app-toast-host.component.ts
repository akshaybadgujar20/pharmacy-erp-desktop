import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { mergeToastHostConfig } from './adapter/toast-defaults';
import { ToastHostConfig } from './types/toast-host.types';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [ToastModule],
  template: `
    <p-toast
      [position]="mergedConfig().position"
      [key]="mergedConfig().key"
      [mode]="mergedConfig().mode"
      [stackVisibleLimit]="mergedConfig().stackVisibleLimit"
      [baseZIndex]="mergedConfig().baseZIndex"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppToastHostComponent {
  readonly config = input<ToastHostConfig>({});

  readonly mergedConfig = computed(() => mergeToastHostConfig(this.config()));
}
