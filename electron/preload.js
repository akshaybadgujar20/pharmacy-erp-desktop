const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getDeviceInfo: () => ipcRenderer.invoke('device:getInfo'),
  printReceipt: (html) => ipcRenderer.invoke('print:receipt', html),
  saveExport: (request) => ipcRenderer.invoke('export:save', request),
  onSyncRunRequested: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('sync:runNow', listener)
    return () => ipcRenderer.removeListener('sync:runNow', listener)
  },
  onBarcodeScan: (callback) => {
    const listener = (_event, barcode) => callback(barcode)
    ipcRenderer.on('barcode:scan', listener)
    return () => ipcRenderer.removeListener('barcode:scan', listener)
  },
  secureStore: {
    get: (key) => ipcRenderer.invoke('secure-store:get', key),
    set: (key, value) => ipcRenderer.invoke('secure-store:set', key, value),
    delete: (key) => ipcRenderer.invoke('secure-store:delete', key),
  },
})
