import { Injectable } from '@angular/core';
import {
  ElectronSaveExportRequest,
  ElectronSaveExportResult,
} from '../models/electron-api.types';

@Injectable({ providedIn: 'root' })
export class ElectronService {
  isElectron(): boolean {
    return typeof window !== 'undefined' && !!window.electronAPI;
  }

  async printReceipt(
    html: string,
    options?: { deviceName?: string },
  ): Promise<void> {
    if (window.electronAPI?.printReceipt) {
      await window.electronAPI.printReceipt(html, options);
      return;
    }
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  async saveExport(
    request: ElectronSaveExportRequest,
  ): Promise<ElectronSaveExportResult> {
    if (window.electronAPI?.saveExport) {
      return window.electronAPI.saveExport(request);
    }
    const bytes = Uint8Array.from(atob(request.base64Data), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: request.mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = request.defaultFileName;
    anchor.click();
    URL.revokeObjectURL(url);
    return { saved: true };
  }

  onBarcodeScan(handler: (barcode: string) => void): () => void {
    if (window.electronAPI?.onBarcodeScan) {
      return window.electronAPI.onBarcodeScan(handler);
    }
    return () => undefined;
  }

  onSyncRunRequested(handler: () => void): () => void {
    if (window.electronAPI?.onSyncRunRequested) {
      return window.electronAPI.onSyncRunRequested(handler);
    }
    return () => undefined;
  }
}
