export interface ElectronDeviceInfo {
  deviceId: string;
  appVersion: string;
  operatingSystem: string;
}

export interface ElectronSecureStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface ElectronSaveExportRequest {
  defaultFileName: string;
  mimeType: string;
  base64Data: string;
}

export interface ElectronSaveExportResult {
  saved: boolean;
  filePath?: string;
}

export interface ElectronApi {
  getDeviceInfo(): Promise<ElectronDeviceInfo>;
  secureStore: ElectronSecureStore;
  printReceipt(html: string, options?: { deviceName?: string }): Promise<void>;
  saveExport(request: ElectronSaveExportRequest): Promise<ElectronSaveExportResult>;
  onSyncRunRequested(callback: () => void): () => void;
  onBarcodeScan(callback: (barcode: string) => void): () => void;
}
