import { toPrimeMessage } from './toast-message.adapter';

describe('toast-message.adapter', () => {
  it('maps summary and default severity', () => {
    const message = toPrimeMessage({ summary: 'Saved' });
    expect(message.summary).toBe('Saved');
    expect(message.severity).toBe('info');
    expect(message.life).toBe(3000);
    expect(message.key).toBe('app');
  });

  it('passes through severity, detail, and icon', () => {
    const message = toPrimeMessage({
      severity: 'success',
      summary: 'Done',
      detail: 'All changes saved.',
      icon: 'pi pi-check',
    });
    expect(message.severity).toBe('success');
    expect(message.detail).toBe('All changes saved.');
    expect(message.icon).toBe('pi pi-check');
  });

  it('omits life when sticky is true', () => {
    const message = toPrimeMessage({
      summary: 'Loading',
      sticky: true,
      icon: 'pi pi-spinner pi-spin',
    });
    expect(message.sticky).toBe(true);
    expect(message.life).toBeUndefined();
  });

  it('passes styleClass and closable', () => {
    const message = toPrimeMessage({
      summary: 'Custom',
      styleClass: 'my-toast',
      closable: false,
      key: 'custom',
    });
    expect(message.styleClass).toBe('my-toast');
    expect(message.closable).toBe(false);
    expect(message.key).toBe('custom');
  });
});
