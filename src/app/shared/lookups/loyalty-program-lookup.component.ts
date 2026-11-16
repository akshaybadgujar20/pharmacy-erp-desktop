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
import { LoyaltyProgramService } from '../../features/loyalty/loyalty-program.service';
import { LookupOption } from './lookup.types';

@Component({
  selector: 'app-loyalty-program-lookup',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule, TranslatePipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LoyaltyProgramLookupComponent),
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
      [placeholder]="'loyalty.searchProgram' | translate"
      styleClass="w-full"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoyaltyProgramLookupComponent implements ControlValueAccessor {
  private readonly programs = inject(LoyaltyProgramService);

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
    this.programs.getById(value).subscribe({
      next: (program) => {
        this.selected.set({
          id: program.id,
          label: program.programCode,
          sublabel: program.programName,
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
    this.programs
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
              label: row.programCode,
              sublabel: row.programName,
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