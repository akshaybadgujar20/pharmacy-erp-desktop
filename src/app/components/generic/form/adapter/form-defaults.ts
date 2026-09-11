import { FormFieldConfig } from '../types/form-field.types';
import { FormConfig } from '../types/form.types';

export const DEFAULT_FORM_CONFIG: Omit<FormConfig, 'fields'> = {
  layout: {
    columns: 1,
    gap: '1rem',
    labelPosition: 'top',
  },
  actions: {
    submit: true,
    cancel: false,
    submitLabel: 'Save',
    cancelLabel: 'Cancel',
    align: 'start',
  },
  validation: {
    validateOn: 'change',
  },
  appearance: {
    size: 'normal',
    showErrors: 'touched',
    compact: false,
  },
};

function cloneField<T extends object>(field: FormFieldConfig<T>): FormFieldConfig<T> {
  return {
    ...field,
    options: field.options?.map((option) => ({ ...option })),
    validators: field.validators?.map((validator) => ({ ...validator })),
  };
}

export function mergeFormConfig<T extends object>(config: FormConfig<T>): FormConfig<T> {
  const defaults = DEFAULT_FORM_CONFIG;
  return {
    ...defaults,
    ...config,
    layout: { ...defaults.layout, ...config.layout },
    actions: { ...defaults.actions, ...config.actions },
    validation: { ...defaults.validation, ...config.validation },
    appearance: { ...defaults.appearance, ...config.appearance },
    fields: config.fields.map((field) => cloneField(field)),
  };
}
