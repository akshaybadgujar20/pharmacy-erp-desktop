import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { ApiClientError } from '../../../core/models/api-response.types';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let messageService: { add: jest.Mock; clear: jest.Mock };

  beforeEach(() => {
    messageService = {
      add: jest.fn(),
      clear: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MessageService, useValue: messageService },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  it('shows a merged toast message', () => {
    service.show({ summary: 'Saved', detail: 'Done' });
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: 'Saved',
        detail: 'Done',
        severity: 'info',
      }),
    );
  });

  it('uses shorthand helpers with severity', () => {
    service.success('Saved', 'Customer created');
    service.warn('Check fields');
    service.error('Failed', 'Try again');

    expect(messageService.add).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ severity: 'success', summary: 'Saved' }),
    );
    expect(messageService.add).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ severity: 'warn', summary: 'Check fields' }),
    );
    expect(messageService.add).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ severity: 'error', summary: 'Failed' }),
    );
  });

  it('clears all or keyed toasts', () => {
    service.clear();
    service.clear('promise');

    expect(messageService.clear).toHaveBeenNthCalledWith(1);
    expect(messageService.clear).toHaveBeenNthCalledWith(2, 'promise');
  });

  it('maps ApiClientError to error toast', () => {
    service.showApiError(new ApiClientError('VALIDATION_ERROR', 'Invalid input'));
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Invalid input',
        detail: 'VALIDATION_ERROR',
      }),
    );
  });

  it('skips auth redirect error codes', () => {
    service.showApiError(new ApiClientError('UNAUTHORIZED', 'Session expired'));
    service.showApiError(
      new ApiClientError('AUTH_SESSION_EXPIRED', 'Session expired'),
    );
    expect(messageService.add).not.toHaveBeenCalled();
  });

  it('maps generic Error to error toast', () => {
    service.showApiError(new Error('Network failed'));
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Network failed',
      }),
    );
  });

  it('runs loading toast lifecycle on success', async () => {
    jest.useFakeTimers();

    const promise = service.runWithLoadingToast({
      key: 'promise',
      loading: { summary: 'Exporting...' },
      task: async () => 'ok',
      onSuccess: () => ({ summary: 'Export complete', detail: 'Ready' }),
      onError: () => ({ summary: 'Export failed' }),
    });

    await jest.advanceTimersByTimeAsync(300);
    const result = await promise;

    expect(result).toBe('ok');
    expect(messageService.add).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        key: 'promise',
        sticky: true,
        summary: 'Exporting...',
        icon: 'pi pi-spinner pi-spin',
      }),
    );
    expect(messageService.clear).toHaveBeenCalledWith('promise');
    expect(messageService.add).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        key: 'promise',
        severity: 'success',
        summary: 'Export complete',
        detail: 'Ready',
      }),
    );

    jest.useRealTimers();
  });

  it('runs loading toast lifecycle on failure', async () => {
    jest.useFakeTimers();

    const promise = service.runWithLoadingToast({
      key: 'promise',
      task: async () => {
        throw new Error('Boom');
      },
      onSuccess: () => ({ summary: 'Done' }),
      onError: (error) => ({
        summary: 'Failed',
        detail: error instanceof Error ? error.message : 'Unknown',
      }),
    });
    const rejection = expect(promise).rejects.toThrow('Boom');

    await jest.advanceTimersByTimeAsync(300);
    await rejection;
    expect(messageService.clear).toHaveBeenCalledWith('promise');
    expect(messageService.add).toHaveBeenLastCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Failed',
        detail: 'Boom',
      }),
    );

    jest.useRealTimers();
  });
});
