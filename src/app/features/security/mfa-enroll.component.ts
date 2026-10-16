import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-mfa-enroll',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  template: `
    <section class="page-layout">
      <h2>MFA enrollment (TOTP)</h2>
      @if (otpauthUrl()) {
        <p>Scan or enter secret: {{ secret() }}</p>
        <p>{{ otpauthUrl() }}</p>
      }
      <button pButton type="button" label="Start enrollment" (click)="start()"></button>
      <form [formGroup]="form" (ngSubmit)="confirm()">
        <input pInputText formControlName="token" placeholder="6-digit code" />
        <button pButton type="submit" label="Confirm" [disabled]="form.invalid"></button>
      </form>
      @if (message()) {
        <p>{{ message() }}</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MfaEnrollComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly secret = signal('');
  readonly otpauthUrl = signal('');
  readonly message = signal('');

  readonly form = this.fb.nonNullable.group({
    token: ['', [Validators.required, Validators.minLength(6)]],
  });

  start(): void {
    this.api
      .post<{ secret: string; otpauthUrl: string }>('/auth/mfa/enroll/start', {})
      .subscribe({
        next: (result) => {
          this.secret.set(result.secret);
          this.otpauthUrl.set(result.otpauthUrl);
        },
      });
  }

  confirm(): void {
    const token = this.form.getRawValue().token;
    this.api.post('/auth/mfa/enroll/confirm', { token }).subscribe({
      next: () => this.message.set('MFA enabled for this account.'),
    });
  }
}
