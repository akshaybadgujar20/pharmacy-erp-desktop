import type { ElectronApi } from './app/core/models/electron-api.types';

declare global {
  interface Window {
    electronAPI?: ElectronApi;
  }
}
