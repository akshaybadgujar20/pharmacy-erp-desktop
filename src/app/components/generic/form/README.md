# AppForm

Configuration-driven reactive form for pharmacy ERP screens. Generates Angular `FormGroup` controls, renders PrimeNG inputs, and emits events to the parent.

## Location

```text
src/app/components/generic/form/
```

Page-specific configs live next to feature components (e.g. `customer-form.config.ts`).

## Philosophy

- **Config** defines fields, layout, validation rules, and actions.
- **AppForm** owns form mechanics (controls, dirty/touched, rendering, visibility).
- **Parent** owns save/API calls, navigation, and business side effects.

Do not put `onSubmit` handlers in config.

## Usage

```html
<app-form
  [config]="formConfig"
  [value]="customer"
  [loading]="saving()"
  (submit)="onSubmit($event)"
  (cancel)="onCancel()"
  (valueChange)="onValueChange($event)"
/>
```

```ts
import { FormConfig } from '../../components/generic/form';

interface CustomerForm {
  customerCode: string;
  customerType: string;
  creditLimit: number | null;
  isActive: boolean;
}

export const customerFormConfig: FormConfig<CustomerForm> = {
  id: 'customer-form',
  layout: { columns: 2 },
  actions: { submit: true, cancel: true },
  fields: [
    {
      name: 'customerCode',
      label: 'Customer Code',
      type: 'text',
      required: true,
      maxLength: 50,
    },
    {
      name: 'customerType',
      label: 'Customer Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Retail', value: 'RETAIL' },
        { label: 'Credit', value: 'CREDIT' },
      ],
    },
    {
      name: 'creditLimit',
      label: 'Credit Limit',
      type: 'currency',
      visible: (value) => value.customerType === 'CREDIT',
    },
    {
      name: 'isActive',
      label: 'Active',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
};
```

## Supported field types (v1)

| Type | Control |
|------|---------|
| `text` | PrimeNG InputText |
| `textarea` | PrimeNG Textarea |
| `number` | PrimeNG InputNumber |
| `currency` | PrimeNG InputNumber (currency mode) |
| `password` | PrimeNG InputText (password) |
| `select` | PrimeNG Select |
| `checkbox` | PrimeNG Checkbox |
| `switch` | PrimeNG ToggleSwitch |
| `date` | PrimeNG DatePicker |

**Deferred:** `datetime`, `multiSelect`, `radio`, `lookup` (will integrate with AppLookup).

## Events

| Event | Payload |
|-------|---------|
| `submit` | `{ value: T, valid: true }` |
| `cancel` | void |
| `valueChange` | full form value |
| `fieldChange` | `{ name, value, formValue }` |
| `validityChange` | `{ valid, errors }` |

## Conditional fields

Use a simple callback — no rule engine:

```ts
{
  name: 'creditLimit',
  label: 'Credit Limit',
  type: 'currency',
  visible: (value) => value.customerType === 'CREDIT',
}
```

Hidden fields remain in the `FormGroup` and are included in `getRawValue()` on submit.

## Permissions

Fields support the same permission/role gates as AppToolbar (`permission`, `permissions`, `anyPermission`, `role`, `roles`).

## Inputs

| Input | Purpose |
|-------|---------|
| `config` | `FormConfig<T>` (required) |
| `value` | Patch external value into the form |
| `loading` | Disables submit and shows loading on submit button |
| `disabled` | Disables the entire form |
