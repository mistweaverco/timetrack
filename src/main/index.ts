import { app, BrowserWindow, shell } from 'electron'
import { electronApp } from '@electron-toolkit/utils'
import { join } from 'path'
import { initDB } from '../database'
import { initIpcHandlers, periodicSaveActiveTasks } from './ipcHandlers'
import { loadWindowContents } from './utils'
import icon from './../assets/icon/icon.png?asset'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 600,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  })

  loadWindowContents(mainWindow, 'index.html')

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
}

app.on('window-all-closed', async () => {
  await periodicSaveActiveTasks()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('app.mwco.timetrack')

  app.commandLine.appendSwitch('disable-gpu-vsync')

  // Initialize database
  await initDB()

  // Periodic save every 30 seconds
  setInterval(async () => {
    await periodicSaveActiveTasks()
  }, 30000)

  createWindow()

  // Initialize IPC handlers after window is created
  // Wait a bit for window to be ready
  setTimeout(async () => {
    if (mainWindow) {
      await initIpcHandlers(mainWindow)
    }
  }, 100)
})
