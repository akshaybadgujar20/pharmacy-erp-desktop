import { FormControl } from '@angular/forms';
import { buildFieldValidators, getFieldErrorMessage } from './form-validator.adapter';
import { FormFieldConfig } from '../types/form-field.types';

describe('form-validator.adapter', () => {
  it('maps required and length validators', () => {
    const field: FormFieldConfig = {
      name: 'code',
      label: 'Code',
      type: 'text',
      required: true,
      minLength: 3,
    };

    const control = new FormControl('', buildFieldValidators(field));
    control.setValue('ab');
    control.updateValueAndValidity();

    expect(control.invalid).toBe(true);
    expect(getFieldErrorMessage(field, control.errors)).toBe('Minimum length is 3');
  });

  it('maps custom validator message', () => {
    const field: FormFieldConfig = {
      name: 'code',
      label: 'Code',
      type: 'text',
      validators: [
        {
          type: 'custom',
          message: 'Code must start with C',
          validator: (value) => String(value ?? '').startsWith('C'),
        },
      ],
    };

    const control = new FormControl('A', buildFieldValidators(field));
    control.updateValueAndValidity();

    expect(getFieldErrorMessage(field, control.errors)).toBe('Code must start with C');
  });
});
