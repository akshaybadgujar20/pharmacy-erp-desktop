import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { resolveApiErrorMessage } from '../../core/utils/api-error-message.util';

@Component({
  selector: 'app-change-pin',
  standalone: true,
  imports: [ReactiveFormsModule, InputOtpModule, ButtonModule, TranslatePipe],
  template: `
    <h2>{{ 'auth.changePinTitle' | translate }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label>
        <span>{{ 'auth.currentPin' | translate }}</span>
        <p-inputotp formControlName="currentPin" [length]="6" [integerOnly]="true" [mask]="true" />
      </label>
      <label>
        <span>{{ 'auth.newPin' | translate }}</span>
        <p-inputotp formControlName="newPin" [length]="6" [integerOnly]="true" [mask]="true" />
      </label>
      <button pButton type="submit" [disabled]="saving() || form.invalid">
        {{ 'auth.updatePin' | translate }}
      </button>
      @if (message()) {
        <p>{{ message() }}</p>
      }
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePinComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly saving = signal(false);
  readonly message = signal('');

  readonly form = this.fb.nonNullable.group({
    currentPin: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    newPin: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    firstValueFrom(this.api.post('/auth/change-pin', this.form.getRawValue()))
      .then(() => {
        this.saving.set(false);
        this.message.set(this.translate.instant('auth.pinUpdated'));
      })
      .catch((error) => {
        this.saving.set(false);
        this.message.set(resolveApiErrorMessage(error));
      });
  }
}