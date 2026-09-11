import { NgStyle } from '@angular/common';
import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../../core/services/auth.service';
import { AppFormComponent } from './app-form.component';
import { FormFieldConfig } from './types/form-field.types';
import { FormConfig } from './types/form.types';

interface DemoForm {
  customerCode: string;
  customerType: string;
  creditLimit: number | null;
  isActive: boolean;
}

@Component({
  selector: 'app-form-field',
  standalone: true,
  template: '',
})
class FormFieldStubComponent {
  field = input.required<FormFieldConfig<DemoForm>>();
  control = input.required<FormControl>();
  formId = input.required<string>();
  showErrors = input<'touched' | 'dirty' | 'always'>('touched');
  submitted = input(false);
}

describe('AppFormComponent', () => {
  let fixture: ComponentFixture<AppFormComponent<DemoForm>>;
  let component: AppFormComponent<DemoForm>;

  const config: FormConfig<DemoForm> = {
    id: 'demo-form',
    fields: [
      {
        name: 'customerCode',
        label: 'Customer Code',
        type: 'text',
        required: true,
      },
      {
        name: 'customerType',
        label: 'Customer Type',
        type: 'select',
        defaultValue: 'RETAIL',
        options: [
          { label: 'Retail', value: 'RETAIL' },
          { label: 'Credit', value: 'CREDIT' },
        ],
      },
      {
        name: 'creditLimit',
        label: 'Credit Limit',
        type: 'number',
        visible: (value) => value.customerType === 'CREDIT',
      },
      {
        name: 'isActive',
        label: 'Active',
        type: 'checkbox',
        defaultValue: true,
      },
    ],
    actions: { submit: true, cancel: true },
  };

  const authServiceMock = {
    hasPermission: jest.fn(() => true),
    hasRole: jest.fn(() => false),
    hasAnyRole: jest.fn(() => false),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppFormComponent],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    })
      .overrideComponent(AppFormComponent, {
        set: {
          imports: [NgStyle, ReactiveFormsModule, ButtonModule, FormFieldStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppFormComponent<DemoForm>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', config);
    fixture.detectChanges();
  });

  it('builds a form group from config', () => {
    expect(component.form.get('customerCode')).toBeTruthy();
    expect(component.form.get('customerType')?.value).toBe('RETAIL');
    expect(component.form.get('isActive')?.value).toBe(true);
  });

  it('filters visible fields based on form value', () => {
    expect(component.visibleFields().map((field) => field.name)).not.toContain('creditLimit');

    component.form.get('customerType')?.setValue('CREDIT');

    expect(component.visibleFields().map((field) => field.name)).toContain('creditLimit');
  });

  it('emits submit when form is valid', () => {
    const submitSpy = jest.fn();
    component.submit.subscribe(submitSpy);

    component.form.patchValue({
      customerCode: 'CUST-001',
      customerType: 'RETAIL',
      creditLimit: null,
      isActive: true,
    });
    component.onSubmit();

    expect(submitSpy).toHaveBeenCalledWith({
      value: {
        customerCode: 'CUST-001',
        customerType: 'RETAIL',
        creditLimit: null,
        isActive: true,
      },
      valid: true,
    });
  });

  it('does not emit submit when form is invalid', () => {
    const submitSpy = jest.fn();
    component.submit.subscribe(submitSpy);

    component.form.patchValue({ customerCode: '' });
    component.onSubmit();

    expect(submitSpy).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
  });

  it('patches external value input', () => {
    fixture.componentRef.setInput('value', {
      customerCode: 'PATCHED',
      customerType: 'CREDIT',
      creditLimit: 5000,
      isActive: false,
    });
    fixture.detectChanges();

    expect(component.form.get('customerCode')?.value).toBe('PATCHED');
    expect(component.form.get('creditLimit')?.value).toBe(5000);
  });

  it('emits cancel output', () => {
    const cancelSpy = jest.fn();
    component.cancel.subscribe(cancelSpy);
    component.onCancel();
    expect(cancelSpy).toHaveBeenCalled();
  });
});
