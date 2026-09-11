import { Injectable, Type, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { applyConfirmPreset } from '../adapter/confirm-presets';
import {
  toDynamicDialogOptions,
  toPrimeConfirmOptions,
  toPrimeConfirmPopupOptions,
} from '../adapter/dialog-adapter';
import { mergeConfirmConfig } from '../adapter/dialog-defaults';
import { ConfirmDialogConfig } from '../types/confirm-dialog.types';
import { ConfirmPopupConfig } from '../types/confirm-popup.types';
import { DynamicDialogConfig } from '../types/dynamic-dialog.types';

@Injectable({ providedIn: 'root' })
export class AppDialogService {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly dialogService = inject(DialogService);

  confirm(config: ConfirmDialogConfig): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      const options = toPrimeConfirmOptions(
        config,
        () => {
          observer.next(true);
          observer.complete();
        },
        () => {
          observer.next(false);
          observer.complete();
        },
      );
      this.confirmationService.confirm(options);
    });
  }

  confirmPopup(config: ConfirmPopupConfig, target: EventTarget): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      const options = toPrimeConfirmPopupOptions(
        config,
        target,
        () => {
          observer.next(true);
          observer.complete();
        },
        () => {
          observer.next(false);
          observer.complete();
        },
      );
      this.confirmationService.confirm(options);
    });
  }

  confirmDelete(message?: string, header?: string): Observable<boolean> {
    return this.confirm(
      applyConfirmPreset(
        mergeConfirmConfig({
          message: message ?? 'Do you want to delete this record?',
          header: header ?? 'Danger Zone',
          preset: 'danger',
        }),
        'danger',
      ),
    );
  }

  openDynamic<T>(component: Type<T>, config: DynamicDialogConfig = {}): DynamicDialogRef {
    const ref = this.dialogService.open(component, toDynamicDialogOptions(config));
    if (!ref) {
      throw new Error('Failed to open dynamic dialog');
    }
    return ref;
  }
}
