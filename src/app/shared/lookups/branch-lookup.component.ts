import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TranslatePipe } from '@ngx-translate/core';
import { BranchService } from '../../features/configuration/branches/branch.service';
import { LookupOption } from './lookup.types';

@Component({
  selector: 'app-branch-lookup',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule, TranslatePipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BranchLookupComponent),
      multi: true,
    },
  ],
  template: `
    <p-autocomplete
      [ngModel]="selected()"
      (ngModelChange)="onSelect($event)"
      [suggestions]="suggestions()"
      (completeMethod)="search($event.query)"
      optionLabel="label"
      [dropdown]="true"
      [forceSelection]="true"
      [disabled]="disabled()"
      [placeholder]="'pricing.searchBranch' | translate"
      styleClass="w-full"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchLookupComponent implements ControlValueAccessor {
  private readonly branches = inject(BranchService);

  readonly disabled = input(false);

  readonly suggestions = signal<LookupOption[]>([]);
  readonly selected = signal<LookupOption | null>(null);

  private valueId: string | null = null;
  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.valueId = value;
    if (!value) {
      this.selected.set(null);
      return;
    }
    this.branches.getById(value).subscribe({
      next: (branch) => {
        this.selected.set({
          id: branch.id,
          label: branch.branchCode,
          sublabel: branch.branchName,
        });
      },
    });
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    void isDisabled;
  }

  search(query: string): void {
    const q = query.trim();
    this.branches
      .list({
        page: '1',
        pageSize: '20',
        ...(q ? { search: q } : {}),
      })
      .subscribe({
        next: ({ data }) => {
          this.suggestions.set(
            data.map((row) => ({
              id: row.id,
              label: row.branchCode,
              sublabel: row.branchName,
            })),
          );
        },
      });
  }

  onSelect(option: LookupOption | null): void {
    this.selected.set(option);
    this.valueId = option?.id ?? null;
    this.onChange(this.valueId);
    this.onTouched();
  }
}