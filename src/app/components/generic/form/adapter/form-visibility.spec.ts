import { filterVisibleFields, isFieldVisible } from './form-visibility';
import { FormFieldConfig } from '../types/form-field.types';

interface DemoForm {
  type: string;
  creditLimit: number | null;
}

describe('form-visibility', () => {
  const access = {
    hasPermission: (permission: string) => permission === 'ALLOWED',
    hasAnyRole: () => true,
  };

  const fields: FormFieldConfig<DemoForm>[] = [
    { name: 'type', label: 'Type', type: 'text' },
    {
      name: 'creditLimit',
      label: 'Credit Limit',
      type: 'number',
      visible: (value) => value.type === 'CREDIT',
    },
    {
      name: 'type',
      label: 'Restricted',
      type: 'text',
      hidden: true,
    },
    {
      name: 'type',
      label: 'Permission',
      type: 'text',
      permission: 'ALLOWED',
    },
    {
      name: 'type',
      label: 'Denied',
      type: 'text',
      permission: 'DENIED',
    },
  ];

  it('evaluates hidden, visible callback, and permissions', () => {
    expect(isFieldVisible(fields[0], { type: 'RETAIL' }, access)).toBe(true);
    expect(isFieldVisible(fields[1], { type: 'RETAIL' }, access)).toBe(false);
    expect(isFieldVisible(fields[1], { type: 'CREDIT' }, access)).toBe(true);
    expect(isFieldVisible(fields[2], { type: 'CREDIT' }, access)).toBe(false);
    expect(isFieldVisible(fields[4], { type: 'CREDIT' }, access)).toBe(false);
  });

  it('filters visible fields', () => {
    const visible = filterVisibleFields(fields, { type: 'CREDIT' }, access);
    expect(visible.map((field) => field.label)).toEqual([
      'Type',
      'Credit Limit',
      'Permission',
    ]);
  });
});
