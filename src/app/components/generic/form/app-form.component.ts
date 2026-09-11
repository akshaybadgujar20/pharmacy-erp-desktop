import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';
import {
  buildFormGroup,
  getFormErrors,
  getFormValue,
  patchFormValue,
} from './adapter/form-builder.adapter';
import { mergeFormConfig } from './adapter/form-defaults';
import {
  createFormAccessContext,
  filterVisibleFields,
} from './adapter/form-visibility';
import { FormFieldComponent } from './form-field.component';
import {
  FormFieldChangeEvent,
  FormSubmitEvent,
  FormValidityChangeEvent,
} from './types/form-events.types';
import { FormConfig } from './types/form.types';

@Component({
  selector: 'app-form',
  standalone: true,
  imports: [NgStyle, ReactiveFormsModule, ButtonModule, FormFieldComponent],
  templateUrl: './app-form.component.html',
  styleUrl: './app-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppFormComponent<T extends object = object> implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  config = input.required<FormConfig<T>>();
  value = input<Partial<T>>();
  loading = input(false);
  disabled = input(false);

  submit = output<FormSubmitEvent<T>>();
  cancel = output<void>();
  valueChange = output<T>();
  fieldChange = output<FormFieldChangeEvent<T>>();
  validityChange = output<FormValidityChangeEvent>();

  readonly mergedConfig = computed(() => mergeFormConfig(this.config()));
  readonly formValue = signal<Partial<T>>({});
  readonly submitted = signal(false);

  form: FormGroup = new FormGroup({});
  private previousValue: Partial<T> = {};
  private patchingFromParent = false;
  private formSubscriptionVersion = 0;
  private readonly fallbackFormId = `app-form-${Math.random().toString(36).slice(2)}`;

  readonly formId = computed(
    () => this.mergedConfig().id ?? this.fallbackFormId,
  );

  readonly visibleFields = computed(() => {
    const access = createFormAccessContext(this.authService);
    return filterVisibleFields(
      this.mergedConfig().fields,
      this.formValue(),
      access,
    );
  });

  readonly layout = computed(() => this.mergedConfig().layout ?? {});
  readonly actions = computed(() => this.mergedConfig().actions ?? {});
  readonly appearance = computed(() => this.mergedConfig().appearance ?? {});

  constructor() {
    effect(() => {
      const config = this.mergedConfig();
      this.rebuildForm(config.fields);
      const external = untracked(() => this.value());
      if (external) {
        this.patchingFromParent = true;
        patchFormValue(this.form, external);
        this.patchingFromParent = false;
      }
      this.syncFormValue();
      this.syncDisabledState();
    });

    effect(() => {
      const external = this.value();
      if (!external || !this.form) {
        return;
      }
      this.patchingFromParent = true;
      patchFormValue(this.form, external);
      this.syncFormValue();
      this.patchingFromParent = false;
    });

    effect(() => {
      this.syncDisabledState();
    });
  }

  ngOnDestroy(): void {
    this.formSubscriptionVersion += 1;
  }

  getControl(name: string): FormControl {
    return this.form.get(name) as FormControl;
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.emitValidityChange();
      return;
    }

    this.submit.emit({
      value: getFormValue<T>(this.form),
      valid: true,
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getFieldStyle(field: { colSpan?: number }): Record<string, string> {
    if (!field.colSpan || field.colSpan <= 1) {
      return {};
    }
    return { gridColumn: `span ${field.colSpan}` };
  }

  private rebuildForm(fields: FormConfig<T>['fields']): void {
    this.formSubscriptionVersion += 1;
    const version = this.formSubscriptionVersion;
    this.form = buildFormGroup(fields);
    this.previousValue = getFormValue<T>(this.form);

    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (version !== this.formSubscriptionVersion) {
          return;
        }
        this.handleValueChanges();
      });

    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (version !== this.formSubscriptionVersion) {
          return;
        }
        this.emitValidityChange();
      });
  }

  private handleValueChanges(): void {
    const current = getFormValue<T>(this.form);
    this.syncFormValue();

    if (!this.patchingFromParent) {
      this.valueChange.emit(current);
      this.emitFieldChanges(current);
    }

    this.emitValidityChange();
  }

  private emitFieldChanges(current: T): void {
    for (const field of this.mergedConfig().fields) {
      const name = field.name;
      const nextValue = current[name as keyof T];
      const previousValue = this.previousValue[name as keyof T];
      if (nextValue !== previousValue) {
        this.fieldChange.emit({
          name,
          value: nextValue,
          formValue: current,
        });
      }
    }
    this.previousValue = { ...current };
  }

  private syncFormValue(): void {
    this.formValue.set(getFormValue<T>(this.form));
  }

  private syncDisabledState(): void {
    if (!this.form) {
      return;
    }
    if (this.disabled()) {
      this.form.disable({ emitEvent: false });
      return;
    }
    this.form.enable({ emitEvent: false });
    for (const field of this.mergedConfig().fields) {
      const control = this.form.get(field.name);
      if (!control) {
        continue;
      }
      if (field.disabled) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    }
  }

  private emitValidityChange(): void {
    this.validityChange.emit({
      valid: this.form.valid,
      errors: getFormErrors(this.form),
    });
  }
}
