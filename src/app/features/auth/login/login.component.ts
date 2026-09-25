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
import {LoadingService} from '../../../shared/services/loading.service';
import {timeout} from 'rxjs';

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
  private readonly loadingService = inject(LoadingService);
  passwordVariant: 'outlined' | 'text' | undefined = undefined;
  dialpadVariant: 'outlined' | 'text' | undefined = 'outlined';

  loginMode = LoginMode.PASSWORD;

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    pin: ['', Validators.required],
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
      this.loadingService.show();
      await this.authService.login(this.form.getRawValue());
      await this.router.navigate(['/dashboard']);
      this.loadingService.hide();
    } catch (error) {
      this.loadingService.hide();
      this.errorMessage =
        error instanceof ApiClientError
          ? error.message
          : error instanceof Error
            ? error.message
            : this.translate.instant('auth.loginFailed');
    } finally {
      this.loadingService.hide();
    }
  }

  toggleDialpadButton(): void {
    if(this.dialpadVariant !== "outlined"){
      this.dialpadVariant = "outlined";
    }else {
      this.dialpadVariant = undefined;
      this.loginMode = LoginMode.PIN;
    }
    if(this.passwordVariant !== undefined){
      this.passwordVariant = undefined;
    }else {
      this.passwordVariant = "outlined";
    }
  }

  togglePasswordButton(): void {
    if(this.passwordVariant !== undefined){
      this.passwordVariant = undefined;
      this.loginMode = LoginMode.PASSWORD;
    }else {
      this.passwordVariant = "outlined";
    }
    if(this.dialpadVariant !== "outlined"){
      this.dialpadVariant = "outlined";
    }else {
      this.dialpadVariant = undefined;
    }
  }

  protected readonly LoginMode = LoginMode;
}
