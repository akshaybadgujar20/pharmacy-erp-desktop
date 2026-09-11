import { DEFAULT_FORM_CONFIG, mergeFormConfig } from './form-defaults';
import { FormConfig } from '../types/form.types';

interface DemoForm {
  name: string;
}

describe('form-defaults', () => {
  it('merges layout, actions, validation, and appearance defaults', () => {
    const config: FormConfig<DemoForm> = {
      fields: [{ name: 'name', label: 'Name', type: 'text' }],
      layout: { columns: 2 },
      actions: { cancel: true },
    };

    const merged = mergeFormConfig(config);

    expect(merged.layout?.columns).toBe(2);
    expect(merged.layout?.gap).toBe(DEFAULT_FORM_CONFIG.layout?.gap);
    expect(merged.actions?.submit).toBe(true);
    expect(merged.actions?.cancel).toBe(true);
    expect(merged.validation?.validateOn).toBe('change');
    expect(merged.appearance?.showErrors).toBe('touched');
  });

  it('clones fields and options', () => {
    const config: FormConfig<DemoForm> = {
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'select',
          options: [{ label: 'A', value: 'a' }],
        },
      ],
    };

    const merged = mergeFormConfig(config);
    merged.fields[0].options![0].label = 'Changed';

    expect(config.fields[0].options![0].label).toBe('A');
  });
});
