import {
  toDynamicDialogOptions,
  toPrimeConfirmOptions,
  toPrimeDialogBindings,
  toPrimeDrawerBindings,
} from './dialog-adapter';

describe('dialog-adapter', () => {
  it('maps confirm config to PrimeNG confirmation options', () => {
    const accept = jest.fn();
    const reject = jest.fn();
    const options = toPrimeConfirmOptions(
      { message: 'Proceed?', header: 'Confirm', preset: 'info' },
      accept,
      reject,
    );

    expect(options.message).toBe('Proceed?');
    expect(options.accept).toBe(accept);
    expect(options.reject).toBe(reject);
    expect(options.rejectButtonProps?.outlined).toBe(true);
  });

  it('maps dialog config bindings', () => {
    const bindings = toPrimeDialogBindings({ header: 'Edit', width: '24rem' });
    expect(bindings.header).toBe('Edit');
    expect(bindings.style?.width).toBe('24rem');
    expect(bindings.modal).toBe(true);
  });

  it('maps drawer config bindings', () => {
    const bindings = toPrimeDrawerBindings({ position: 'right', styleClass: 'w-80' });
    expect(bindings.position).toBe('right');
    expect(bindings.styleClass).toBe('w-80');
  });

  it('maps dynamic dialog options', () => {
    const options = toDynamicDialogOptions({ header: 'Select', data: { id: '1' } });
    expect(options.header).toBe('Select');
    expect(options.data).toEqual({ id: '1' });
  });
});
