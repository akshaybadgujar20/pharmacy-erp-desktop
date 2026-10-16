const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getDeviceInfo: () => ipcRenderer.invoke('device:getInfo'),
  onSyncRunRequested: (callback) => {
    const listener = () => callback()
    ipcRenderer.on('sync:runNow', listener)
    return () => ipcRenderer.removeListener('sync:runNow', listener)
  },
  secureStore: {
    get: (key) => ipcRenderer.invoke('secure-store:get', key),
    set: (key, value) => ipcRenderer.invoke('secure-store:set', key, value),
    delete: (key) => ipcRenderer.invoke('secure-store:delete', key),
  },
})
