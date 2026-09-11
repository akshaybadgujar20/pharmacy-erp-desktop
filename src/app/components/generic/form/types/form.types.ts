import { FormActionsConfig } from './form-actions.types';
import { FormAppearanceConfig } from './form-appearance.types';
import { FormFieldConfig } from './form-field.types';
import { FormLayoutConfig } from './form-layout.types';
import { FormValidationConfig } from './form-validation.types';

export interface FormConfig<T extends object = object> {
  id?: string;
  fields: FormFieldConfig<T>[];
  layout?: FormLayoutConfig;
  validation?: FormValidationConfig;
  actions?: FormActionsConfig;
  appearance?: FormAppearanceConfig;
}
