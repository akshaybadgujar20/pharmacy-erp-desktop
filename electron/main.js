const { app, BrowserWindow, ipcMain, safeStorage } = require('electron')
const path = require('path')
const os = require('os')
const { randomUUID } = require('crypto')

const secureStore = new Map()

let mainWindow

function getDeviceId() {
  const envDeviceId = process.env.DEVICE_ID
  if (envDeviceId) {
    return envDeviceId
  }
  return `desktop-${os.hostname()}-${randomUUID().slice(0, 8)}`
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.loadURL('http://localhost:4200')

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  });
}

ipcMain.handle('device:getInfo', () => ({
  deviceId: getDeviceId(),
  appVersion: app.getVersion(),
  operatingSystem: `${os.type()} ${os.release()}`
}))

ipcMain.handle('secure-store:get', (_event, key) => {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = secureStore.get(key)
    if (!encrypted) {
      return null
    }
    return safeStorage.decryptString(Buffer.from(encrypted))
  }
  return secureStore.get(key) ?? null
})

ipcMain.handle('secure-store:set', (_event, key, value) => {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(value)
    secureStore.set(key, encrypted)
    return
  }
  secureStore.set(key, value)
})

ipcMain.handle('secure-store:delete', (_event, key) => {
  secureStore.delete(key)
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
