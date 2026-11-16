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
import { DoctorService } from '../../features/party/doctors/doctor.service';
import { LookupOption } from './lookup.types';

@Component({
  selector: 'app-doctor-lookup',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DoctorLookupComponent),
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
      placeholder="Search doctor"
      styleClass="w-full"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorLookupComponent implements ControlValueAccessor {
  private readonly doctors = inject(DoctorService);

  readonly disabled = input(false);

  readonly suggestions = signal<LookupOption[]>([]);
  readonly selected = signal<LookupOption | null>(null);

  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    if (!value) {
      this.selected.set(null);
      return;
    }
    this.doctors.getById(value).subscribe({
      next: (doctor) => {
        this.selected.set({
          id: doctor.id,
          label: doctor.doctorCode,
          sublabel: doctor.registrationNumber,
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

  setDisabledState(): void {
    return;
  }

  search(query: string): void {
    const q = query.trim();
    this.doctors
      .list({ page: '1', pageSize: '20', ...(q ? { search: q } : {}) })
      .subscribe({
        next: ({ data }) => {
          this.suggestions.set(
            data.map((row) => ({
              id: row.id,
              label: row.doctorCode,
              sublabel: row.registrationNumber,
            })),
          );
        },
      });
  }

  onSelect(option: LookupOption | null): void {
    this.selected.set(option);
    this.onChange(option?.id ?? null);
    this.onTouched();
  }
}
