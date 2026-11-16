import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { BranchService } from '../../features/configuration/branches/branch.service';

interface BranchOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-branch-select',
  standalone: true,
  imports: [FormsModule, SelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BranchSelectComponent),
      multi: true,
    },
  ],
  template: `
    <p-select
      [options]="options()"
      optionLabel="label"
      optionValue="value"
      [ngModel]="value()"
      (ngModelChange)="onSelect($event)"
      [disabled]="disabled() || controlDisabled()"
      [filter]="true"
      appendTo="body"
      placeholder="Select branch"
      styleClass="w-full"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchSelectComponent implements ControlValueAccessor, OnInit {
  private readonly branches = inject(BranchService);

  readonly disabled = input(false);

  readonly options = signal<BranchOption[]>([]);
  readonly value = signal<string | null>(null);
  readonly controlDisabled = signal(false);

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  ngOnInit(): void {
    this.branches.list({ page: '1', pageSize: '100' }).subscribe({
      next: ({ data }) => {
        this.options.set(
          data.map((branch) => ({
            label: `${branch.branchCode} — ${branch.branchName}`,
            value: branch.id,
          })),
        );
      },
    });
  }

  writeValue(value: string | null): void {
    this.value.set(value || null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  onSelect(value: string | null): void {
    this.value.set(value || null);
    this.onChange(value || null);
    this.onTouched();
  }
}
