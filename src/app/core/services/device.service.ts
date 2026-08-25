import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private deviceId: string | null = null;

  async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }

    if (window.electronAPI?.getDeviceInfo) {
      const info = await window.electronAPI.getDeviceInfo();
      this.deviceId = info.deviceId;
      return info.deviceId;
    }

    this.deviceId = 'desktop-dev-001';
    return this.deviceId;
  }

  async getDeviceInfo(): Promise<{
    deviceId: string;
    deviceName?: string;
    deviceType: string;
    operatingSystem?: string;
    applicationVersion?: string;
  }> {
    if (window.electronAPI?.getDeviceInfo) {
      const info = await window.electronAPI.getDeviceInfo();
      return {
        deviceId: info.deviceId,
        deviceName: 'Pharmacy ERP Desktop',
        deviceType: 'DESKTOP',
        operatingSystem: info.operatingSystem,
        applicationVersion: info.appVersion,
      };
    }

    return {
      deviceId: await this.getDeviceId(),
      deviceName: 'Pharmacy ERP Dev',
      deviceType: 'DESKTOP',
      operatingSystem: navigator.platform,
      applicationVersion: 'dev',
    };
  }
}
