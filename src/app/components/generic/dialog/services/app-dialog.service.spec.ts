import { TestBed } from '@angular/core/testing';
import { ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { Component } from '@angular/core';
import { AppDialogService } from './app-dialog.service';

@Component({ standalone: true, template: '' })
class DemoComponent {}

describe('AppDialogService', () => {
  let service: AppDialogService;
  let confirmationService: jest.Mocked<Pick<ConfirmationService, 'confirm'>>;
  let dialogService: jest.Mocked<Pick<DialogService, 'open'>>;

  beforeEach(() => {
    confirmationService = {
      confirm: jest.fn((options) => options.accept?.()),
    };
    dialogService = {
      open: jest.fn(() => ({ onClose: { subscribe: jest.fn() } }) as unknown as DynamicDialogRef),
    };

    TestBed.configureTestingModule({
      providers: [
        AppDialogService,
        { provide: ConfirmationService, useValue: confirmationService },
        { provide: DialogService, useValue: dialogService },
      ],
    });

    service = TestBed.inject(AppDialogService);
  });

  it('confirm emits true when accepted', (done) => {
    service.confirm({ message: 'Save?' }).subscribe((result) => {
      expect(result).toBe(true);
      expect(confirmationService.confirm).toHaveBeenCalled();
      done();
    });
  });

  it('confirm emits false when rejected', (done) => {
    confirmationService.confirm.mockImplementation((options) => options.reject?.());

    service.confirm({ message: 'Save?' }).subscribe((result) => {
      expect(result).toBe(false);
      done();
    });
  });

  it('confirmPopup passes target to confirmation service', (done) => {
    const target = document.createElement('button');

    service.confirmPopup({ message: 'Proceed?' }, target).subscribe((result) => {
      expect(result).toBe(true);
      expect(confirmationService.confirm).toHaveBeenCalledWith(
        expect.objectContaining({ target, message: 'Proceed?' }),
      );
      done();
    });
  });

  it('openDynamic delegates to DialogService', () => {
    const ref = service.openDynamic(DemoComponent, { header: 'Demo' });
    expect(dialogService.open).toHaveBeenCalledWith(
      DemoComponent,
      expect.objectContaining({ header: 'Demo' }),
    );
    expect(ref).toBeTruthy();
  });
});
