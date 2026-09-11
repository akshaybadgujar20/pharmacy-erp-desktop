export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'password'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'date'
  | 'currency';

export interface SelectOption {
  label: string;
  value: unknown;
  disabled?: boolean;
}

export interface FormValidatorConfig {
  type: 'email' | 'pattern' | 'custom';
  message?: string;
  pattern?: string | RegExp;
  validator?: (value: unknown) => boolean;
}

export interface FormFieldConfig<T extends object = object> {
  name: keyof T & string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  hidden?: boolean;
  visible?: (value: Partial<T>) => boolean;
  width?: string;
  colSpan?: number;
  defaultValue?: unknown;
  options?: SelectOption[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  validators?: FormValidatorConfig[];
  permission?: string;
  permissions?: string[];
  anyPermission?: string[];
  role?: string;
  roles?: string[];
  currency?: string;
  locale?: string;
}
