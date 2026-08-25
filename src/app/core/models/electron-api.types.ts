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

export interface ElectronApi {
  getDeviceInfo(): Promise<ElectronDeviceInfo>;
  secureStore: ElectronSecureStore;
}
