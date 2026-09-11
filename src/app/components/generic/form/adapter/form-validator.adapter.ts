import { ValidatorFn, Validators } from '@angular/forms';
import { FormFieldConfig, FormValidatorConfig } from '../types/form-field.types';

export function buildFieldValidators<T extends object = object>(
  field: FormFieldConfig<T>,
): ValidatorFn[] {
  const validators: ValidatorFn[] = [];

  if (field.required) {
    validators.push(Validators.required);
  }
  if (field.minLength != null) {
    validators.push(Validators.minLength(field.minLength));
  }
  if (field.maxLength != null) {
    validators.push(Validators.maxLength(field.maxLength));
  }
  if (field.min != null) {
    validators.push(Validators.min(field.min));
  }
  if (field.max != null) {
    validators.push(Validators.max(field.max));
  }

  if (field.validators?.length) {
    for (const rule of field.validators) {
      const fn = toValidatorFn(rule);
      if (fn) {
        validators.push(fn);
      }
    }
  }

  return validators;
}

function toValidatorFn(rule: FormValidatorConfig): ValidatorFn | null {
  switch (rule.type) {
    case 'email':
      return Validators.email;
    case 'pattern':
      if (rule.pattern == null) {
        return null;
      }
      return Validators.pattern(rule.pattern);
    case 'custom':
      if (!rule.validator) {
        return null;
      }
      return (control) => {
        const valid = rule.validator!(control.value);
        return valid ? null : { custom: { message: rule.message } };
      };
    default:
      return null;
  }
}

export function getFieldErrorMessage<T extends object = object>(
  field: FormFieldConfig<T>,
  errors: Record<string, unknown> | null | undefined,
): string | null {
  if (!errors) {
    return null;
  }

  if (errors['required']) {
    return `${field.label} is required`;
  }
  if (errors['email']) {
    return 'Invalid email address';
  }
  if (errors['minlength']) {
    const detail = errors['minlength'] as { requiredLength: number };
    return `Minimum length is ${detail.requiredLength}`;
  }
  if (errors['maxlength']) {
    const detail = errors['maxlength'] as { requiredLength: number };
    return `Maximum length is ${detail.requiredLength}`;
  }
  if (errors['min']) {
    const detail = errors['min'] as { min: number };
    return `Minimum value is ${detail.min}`;
  }
  if (errors['max']) {
    const detail = errors['max'] as { max: number };
    return `Maximum value is ${detail.max}`;
  }
  if (errors['pattern']) {
    return 'Invalid format';
  }
  if (errors['custom']) {
    const detail = errors['custom'] as { message?: string };
    return detail.message ?? 'Invalid value';
  }

  return 'Invalid value';
}
