import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ApiService } from '../../core/services/api.service';
import { resolveApiErrorMessage } from '../../core/utils/api-error-message.util';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule],
  template: `
    <h2>Change password</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input pInputText type="password" formControlName="currentPassword" placeholder="Current password" />
      <input pInputText type="password" formControlName="newPassword" placeholder="New password" />
      <button pButton type="submit" [disabled]="saving() || form.invalid">Update</button>
      @if (message()) {
        <p>{{ message() }}</p>
      }
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly saving = signal(false);
  readonly message = signal('');

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.api.post('/auth/change-password', this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set('Password updated.');
      },
      error: (error) => {
        this.saving.set(false);
        this.message.set(resolveApiErrorMessage(error));
      },
    });
  }
}
