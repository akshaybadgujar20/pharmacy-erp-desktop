import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { getFieldErrorMessage } from './adapter/form-validator.adapter';
import { FormShowErrors } from './types/form-appearance.types';
import { FormFieldConfig } from './types/form-field.types';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    ToggleSwitchModule,
    DatePickerModule,
  ],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormFieldComponent<T extends object = object> {
  field = input.required<FormFieldConfig<T>>();
  control = input.required<FormControl>();
  formId = input.required<string>();
  showErrors = input<FormShowErrors>('touched');
  submitted = input(false);

  readonly inputId = computed(() => `${this.formId()}-${this.field().name}`);

  readonly showError = computed(() => {
    const control = this.control();
    if (!control || control.valid) {
      return false;
    }
    const policy = this.showErrors();
    if (policy === 'always') {
      return true;
    }
    if (policy === 'dirty') {
      return control.dirty || this.submitted();
    }
    return control.touched || this.submitted();
  });

  readonly errorMessage = computed(() =>
    getFieldErrorMessage(this.field(), this.control().errors),
  );
}
