import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-masters-import',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  template: `
    <section class="page-layout">
      <h2>Masters CSV import</h2>
      <form [formGroup]="form" (ngSubmit)="run(true)">
        <select formControlName="entityType">
          <option value="country">Country</option>
          <option value="state">State</option>
          <option value="city">City</option>
          <option value="area">Area</option>
        </select>
        <textarea formControlName="csvText" rows="12" placeholder="Paste CSV"></textarea>
        <button pButton type="submit" label="Dry run"></button>
        <button pButton type="button" label="Commit" (click)="run(false)"></button>
      </form>
      @if (result()) {
        <pre>{{ result() }}</pre>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MastersImportComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly result = signal('');

  readonly form = this.fb.nonNullable.group({
    entityType: ['country', Validators.required],
    csvText: ['', Validators.required],
  });

  run(dryRun: boolean): void {
    const value = this.form.getRawValue();
    this.api
      .post('/masters/import', {
        entityType: value.entityType,
        csvText: value.csvText,
        dryRun,
      })
      .subscribe({
        next: (response) => this.result.set(JSON.stringify(response, null, 2)),
      });
  }
}
