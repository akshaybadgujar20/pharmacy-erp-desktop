import { Validators } from '@angular/forms';
import {
  buildFormGroup,
  getDefaultValueForFieldType,
  getFormErrors,
  getFormValue,
  patchFormValue,
} from './form-builder.adapter';
import { FormFieldConfig } from '../types/form-field.types';

interface DemoForm {
  name: string;
  age: number | null;
  active: boolean;
}

describe('form-builder.adapter', () => {
  const fields: FormFieldConfig<DemoForm>[] = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'age', label: 'Age', type: 'number', min: 0, max: 120 },
    { name: 'active', label: 'Active', type: 'checkbox' },
  ];

  it('returns type-appropriate default values', () => {
    expect(getDefaultValueForFieldType('text')).toBe('');
    expect(getDefaultValueForFieldType('number')).toBeNull();
    expect(getDefaultValueForFieldType('checkbox')).toBe(false);
  });

  it('builds a form group with validators', () => {
    const form = buildFormGroup(fields);

    expect(form.get('name')?.value).toBe('');
    expect(form.get('age')?.value).toBeNull();
    expect(form.get('active')?.value).toBe(false);
    expect(form.get('name')?.hasValidator(Validators.required)).toBe(true);
  });

  it('patches values and reads form state', () => {
    const form = buildFormGroup(fields);
    patchFormValue(form, { name: 'Alice', age: 30, active: true });

    const value = getFormValue<DemoForm>(form);
    expect(value.name).toBe('Alice');
    expect(value.age).toBe(30);
    expect(value.active).toBe(true);
  });

  it('collects field errors', () => {
    const form = buildFormGroup(fields);
    form.get('name')?.setValue('');
    form.get('name')?.markAsTouched();

    const errors = getFormErrors(form);
    expect(errors['name']).toBeTruthy();
  });
});
