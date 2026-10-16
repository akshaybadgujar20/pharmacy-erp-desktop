import { ElectronService } from './electron.service';

describe('ElectronService', () => {
  it('reports non-electron when electronAPI is missing', () => {
    const service = new ElectronService();
    expect(service.isElectron()).toBe(false);
  });
});
