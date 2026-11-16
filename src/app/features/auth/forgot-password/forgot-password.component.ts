import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ApiClientError } from '../../../core/models/api-response.types';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

function passwordsMatch(control: AbstractControl): { mismatch: boolean } | null {
  const password = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (!password || !confirm) {
    return null;
  }
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    ButtonModule,
    InputTextModule,
    InputOtpModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly step = signal<'request' | 'confirm'>('request');
  readonly loading = signal(false);
  readonly message = signal('');
  readonly errorMessage = signal('');

  readonly requestForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
  });

  readonly confirmForm = this.fb.nonNullable.group(
    {
      username: ['', Validators.required],
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  otpInput = '';

  async requestCode(): Promise<void> {
    if (this.requestForm.invalid) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    const username = this.requestForm.getRawValue().username;
    try {
      const result = await firstValueFrom(
        this.api.post<{ message: string }>('/auth/forgot-password/request', {
          username,
        }),
      );
      this.message.set(result?.message ?? '');
      this.confirmForm.patchValue({ username });
      this.step.set('confirm');
    } catch (error) {
      this.errorMessage.set(
        error instanceof ApiClientError ? error.message : 'Request failed',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async confirmReset(): Promise<void> {
    this.confirmForm.patchValue({ otp: this.otpInput });
    if (this.confirmForm.invalid) {
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    const { username, otp, newPassword } = this.confirmForm.getRawValue();
    try {
      await firstValueFrom(
        this.api.post('/auth/forgot-password/confirm', {
          username,
          otp,
          newPassword,
        }),
      );
      await this.router.navigate(['/login'], {
        queryParams: { reset: 'success' },
      });
    } catch (error) {
      this.errorMessage.set(
        error instanceof ApiClientError ? error.message : 'Reset failed',
      );
    } finally {
      this.loading.set(false);
    }
  }
}