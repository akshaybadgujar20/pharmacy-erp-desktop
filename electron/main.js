const { app, BrowserWindow, ipcMain, safeStorage, dialog } = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')
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

ipcMain.handle('print:receipt', async (_event, html, options) => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return
  }
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: { contextIsolation: true },
  })
  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  await new Promise((resolve) => {
    const printOptions = { silent: false }
    if (options?.deviceName) {
      printOptions.deviceName = options.deviceName
    }
    printWindow.webContents.print(printOptions, () => {
      printWindow.close()
      resolve()
    })
  })
})

ipcMain.handle('export:save', async (_event, request) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: request.defaultFileName,
  })
  if (canceled || !filePath) {
    return { saved: false }
  }
  const buffer = Buffer.from(request.base64Data, 'base64')
  fs.writeFileSync(filePath, buffer)
  return { saved: true, filePath }
})

let barcodeBuffer = ''
let barcodeTimer = null

function flushBarcodeBuffer() {
  if (barcodeBuffer.length > 0 && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('barcode:scan', barcodeBuffer)
  }
  barcodeBuffer = ''
  barcodeTimer = null
}

app.on('web-contents-created', (_event, contents) => {
  contents.on('before-input-event', (_e, input) => {
    if (input.type !== 'keyDown' || input.key === 'Enter') {
      if (input.key === 'Enter' && barcodeBuffer.length > 0) {
        flushBarcodeBuffer()
      }
      return
    }
    if (input.key.length === 1 && !input.control && !input.alt && !input.meta) {
      barcodeBuffer += input.key
      if (barcodeTimer) {
        clearTimeout(barcodeTimer)
      }
      barcodeTimer = setTimeout(flushBarcodeBuffer, 80)
    }
  })
})

function triggerSyncRun() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('sync:runNow')
  }
}

function startSyncScheduler() {
  const minutes = parseInt(process.env.SYNC_INTERVAL_MINUTES ?? '15', 10)
  const intervalMs = Math.max(minutes, 1) * 60 * 1000
  setInterval(triggerSyncRun, intervalMs)
}

app.whenReady().then(() => {
  createWindow()
  startSyncScheduler()
  triggerSyncRun()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
