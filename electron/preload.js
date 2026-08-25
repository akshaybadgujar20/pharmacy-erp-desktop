const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getDeviceInfo: () => ipcRenderer.invoke('device:getInfo'),
  secureStore: {
    get: (key) => ipcRenderer.invoke('secure-store:get', key),
    set: (key, value) => ipcRenderer.invoke('secure-store:set', key, value),
    delete: (key) => ipcRenderer.invoke('secure-store:delete', key),
  },
})
