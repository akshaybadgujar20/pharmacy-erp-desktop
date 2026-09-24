import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiClientError } from '../../../core/models/api-response.types';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSelectorComponent } from '../../../shared/components/language-selector/language-selector.component';
import { Spinner } from '@primeicons/angular/spinner';
import { InputOtpModule } from 'primeng/inputotp';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { LabelModule } from 'primeng/label';

enum LoginMode {
  PASSWORD,
  PIN,
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    LanguageSelectorComponent,
    InputOtpModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    LabelModule
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);


  pin:number = 0;

  loginMode = LoginMode.PASSWORD;

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  loading = false;
  errorMessage = '';

  async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.form.getRawValue());
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : this.translate.instant('auth.loginFailed');
    } finally {
      this.loading = false;
    }
  }

  protected readonly LoginMode = LoginMode;
}
