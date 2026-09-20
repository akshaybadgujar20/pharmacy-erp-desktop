import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { ApiClientError } from '../../core/models/api-response.types';
import { AppSetting } from './setting.models';
import { SettingService } from './setting.service';

@Component({
  selector: 'app-setting-detail',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './setting-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly settingService = inject(SettingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly version = signal('0');
  readonly setting = signal<AppSetting | null>(null);
  readonly dataType = signal('STRING');
  readonly isEditable = signal(false);

  private settingKey = '';

  readonly form = this.fb.nonNullable.group({
    settingValue: ['', Validators.required],
    booleanValue: [false],
  });

  ngOnInit(): void {
    const key = this.route.snapshot.paramMap.get('key');
    if (!key) {
      this.router.navigate(['/settings']);
      return;
    }

    this.settingKey = key;
    this.load(key);
  }

  save(): void {
    if (!this.isEditable() || this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    const settingValue = this.resolveSettingValue();
    this.settingService
      .update(this.settingKey, {
        version: this.version(),
        settingValue,
      })
      .subscribe({
        next: (updated) => {
          this.version.set(updated.version);
          this.setting.set(updated);
          this.patchFormValues(updated);
          this.saving.set(false);
        },
        error: (error) => this.handleError(error),
      });
  }

  goBack(): void {
    this.router.navigate(['/settings']);
  }

  private load(key: string): void {
    this.settingService.getByKey(key).subscribe({
      next: (setting) => {
        this.setting.set(setting);
        this.version.set(setting.version);
        this.dataType.set(setting.dataType);
        this.isEditable.set(setting.isEditable);
        this.patchFormValues(setting);
        this.updateValueValidators(setting.dataType);
      },
      error: (error) => this.handleError(error),
    });
  }

  private patchFormValues(setting: AppSetting): void {
    if (setting.dataType === 'BOOLEAN') {
      const normalized = (setting.settingValue ?? '').trim().toLowerCase();
      this.form.patchValue({
        booleanValue: normalized === 'true' || normalized === '1',
        settingValue: setting.settingValue ?? '',
      });
      return;
    }

    this.form.patchValue({
      settingValue: setting.settingValue ?? '',
      booleanValue: false,
    });
  }

  private resolveSettingValue(): string {
    if (this.dataType() === 'BOOLEAN') {
      return this.form.getRawValue().booleanValue ? 'true' : 'false';
    }

    return this.form.getRawValue().settingValue;
  }

  private updateValueValidators(dataType: string): void {
    const settingValueControl = this.form.controls.settingValue;
    if (dataType === 'BOOLEAN') {
      settingValueControl.clearValidators();
      settingValueControl.updateValueAndValidity();
      return;
    }

    settingValueControl.setValidators([Validators.required]);
    settingValueControl.updateValueAndValidity();
  }

  private handleError(error: unknown): void {
    this.saving.set(false);
    this.errorMessage.set(
      error instanceof ApiClientError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Request failed',
    );
  }
}
