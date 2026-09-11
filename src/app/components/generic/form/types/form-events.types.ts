export interface FormSubmitEvent<T extends object = object> {
  value: T;
  valid: true;
}

export interface FormFieldChangeEvent<T extends object = object> {
  name: keyof T & string;
  value: unknown;
  formValue: Partial<T>;
}

export interface FormValidityChangeEvent {
  valid: boolean;
  errors: Record<string, unknown>;
}
