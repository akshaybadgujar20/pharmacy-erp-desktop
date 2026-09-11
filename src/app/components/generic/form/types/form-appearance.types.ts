export type FormShowErrors = 'touched' | 'dirty' | 'always';

export interface FormAppearanceConfig {
  size?: 'small' | 'normal' | 'large';
  showErrors?: FormShowErrors;
  fieldClass?: string;
  compact?: boolean;
}
