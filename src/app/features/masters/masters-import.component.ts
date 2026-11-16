import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { resolveApiErrorMessage } from '../../core/utils/api-error-message.util';

interface MastersImportRowResult {
  line: number;
  status: 'OK' | 'SKIP' | 'ERROR';
  message?: string;
}

interface MastersImportResponse {
  dryRun: boolean;
  rowCount: number;
  results: MastersImportRowResult[];
  committed?: boolean;
}

@Component({
  selector: 'app-masters-import',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule, TranslatePipe],
  templateUrl: './masters-import.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MastersImportComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly result = signal<MastersImportResponse | null>(null);

  readonly entityOptions = [
    { value: 'country', labelKey: 'masters.import.entity.country' },
    { value: 'state', labelKey: 'masters.import.entity.state' },
    { value: 'city', labelKey: 'masters.import.entity.city' },
    { value: 'area', labelKey: 'masters.import.entity.area' },
  ];

  readonly form = this.fb.nonNullable.group({
    entityType: ['country', Validators.required],
    csvText: ['', Validators.required],
  });

  run(dryRun: boolean): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();
    this.api
      .post<MastersImportResponse>('/masters/import', {
        entityType: value.entityType,
        csvText: value.csvText,
        dryRun,
      })
      .subscribe({
        next: (response) => {
          this.result.set(response);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(resolveApiErrorMessage(error));
        },
      });
  }
}