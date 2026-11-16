import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {ApiClientError} from '../../../core/models/api-response.types';
import {AuthService} from '../../../core/services/auth.service';
import {LanguageSelectorComponent} from '../../../shared/components/language-selector/language-selector.component';
import {InputOtpModule} from 'primeng/inputotp';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {LabelModule} from 'primeng/label';
import {LoadingService} from '../../../shared/services/loading.service';

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
    LabelModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly loadingService = inject(LoadingService);
  passwordVariant: 'outlined' | 'text' | undefined = undefined;
  dialpadVariant: 'outlined' | 'text' | undefined = 'outlined';

  loginMode = LoginMode.PASSWORD;

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    pin: [''],
  });

  loading = false;
  errorMessage = '';
  successMessage = '';
  mfaStep = false;
  mfaChallengeToken = '';
  totpCode = '';

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('reset') === 'success') {
      this.successMessage = this.translate.instant('auth.resetSuccessMessage');
    } else if (params.get('passwordChanged') === '1') {
      this.successMessage = this.translate.instant('auth.passwordChangedSuccess');
    }
    const username = params.get('username');
    if (username) {
      this.form.patchValue({ username });
    }
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const formValue = this.form.getRawValue();
    try {
      this.loadingService.show();
      if (this.loginMode === LoginMode.PIN) {
        const { password, ...formData } = formValue;
        await this.authService.loginWithPin(formData);
        await this.navigateAfterLogin();
      } else if (this.mfaStep) {
        const { pin, ...formData } = formValue;
        await this.authService.completeMfaLogin({
          ...formData,
          mfaChallengeToken: this.mfaChallengeToken,
          totpCode: this.totpCode,
        });
        await this.navigateAfterLogin();
      } else {
        const { pin, ...formData } = formValue;
        const result = await this.authService.login(formData);
        if ('mfaRequired' in result && result.mfaRequired) {
          this.mfaChallengeToken = result.mfaChallengeToken;
          this.mfaStep = true;
          this.errorMessage = '';
          return;
        }
        await this.navigateAfterLogin();
      }
      this.loadingService.hide();
    } catch (error) {
      this.loadingService.hide();
      if (error instanceof ApiClientError && error.code === 'AUTH_MUST_CHANGE_PASSWORD') {
        const username = formValue.username;
        if (this.loginMode === LoginMode.PIN) {
          await this.router.navigate(['/change-required-pin'], {
            queryParams: { username },
          });
        } else {
          await this.router.navigate(['/change-required-password'], {
            queryParams: { username },
          });
        }
        return;
      }
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
      this.setFormValidation();
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
      this.setFormValidation();
    }else {
      this.passwordVariant = "outlined";
    }
    if(this.dialpadVariant !== "outlined"){
      this.dialpadVariant = "outlined";
    }else {
      this.dialpadVariant = undefined;
    }
  }

  private async navigateAfterLogin(): Promise<void> {
    const user = this.authService.currentUser();
    if (user?.mustChangePin) {
      await this.router.navigate(['/security/change-pin']);
      return;
    }
    await this.router.navigate(['/dashboard']);
  }

  private setFormValidation() {
    const password = this.form.controls.password;
    const pin = this.form.controls.pin;
    if (this.loginMode === LoginMode.PASSWORD) {
      password.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(128)]);
      pin.clearValidators();
    } else {
      password.clearValidators();
      pin.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(6)]);
    }
    password.updateValueAndValidity();
    pin.updateValueAndValidity();
  }

  protected readonly LoginMode = LoginMode;
}
