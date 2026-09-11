import { FormControl, FormGroup } from '@angular/forms';
import { FormFieldConfig, FormFieldType } from '../types/form-field.types';
import { buildFieldValidators } from './form-validator.adapter';

export function getDefaultValueForFieldType(type: FormFieldType): unknown {
  switch (type) {
    case 'checkbox':
    case 'switch':
      return false;
    case 'number':
    case 'currency':
    case 'date':
      return null;
    default:
      return '';
  }
}

export function buildFormGroup<T extends object>(
  fields: FormFieldConfig<T>[],
): FormGroup {
  const controls: Record<string, FormControl> = {};

  for (const field of fields) {
    const defaultValue =
      field.defaultValue !== undefined
        ? field.defaultValue
        : getDefaultValueForFieldType(field.type);

    const control = new FormControl(
      { value: defaultValue, disabled: Boolean(field.disabled) },
      { validators: buildFieldValidators(field) },
    );
    controls[field.name] = control;
  }

  return new FormGroup(controls);
}

export function patchFormValue<T extends object>(
  form: FormGroup,
  value: Partial<T> | undefined,
): void {
  if (!value) {
    return;
  }
  form.patchValue(value, { emitEvent: false });
}

export function getFormValue<T extends object>(form: FormGroup): T {
  return form.getRawValue() as T;
}

export function getFormErrors(form: FormGroup): Record<string, unknown> {
  const errors: Record<string, unknown> = {};
  for (const [name, control] of Object.entries(form.controls)) {
    if (control.errors) {
      errors[name] = control.errors;
    }
  }
  return errors;
}
