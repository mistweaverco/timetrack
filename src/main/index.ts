import { app, BrowserWindow, dialog, shell } from 'electron'
import { electronApp } from '@electron-toolkit/utils'
import { join } from 'path'
import { initDB, setDatabaseFilePath } from '../database'
import { initIpcHandlers, periodicSaveActiveTasks } from './ipcHandlers'
import { loadWindowContents } from './utils'
import icon from './../assets/icon/icon.png?asset'
import {
  getConfiguredDatabases,
  getDBFilePath,
  getUserConfig,
} from '../lib/ConfigFile'

let mainWindow: BrowserWindow | null = null

async function chooseDatabaseForSession(
  parentWindow?: BrowserWindow,
): Promise<void> {
  const userConfig = await getUserConfig()

  if (userConfig) {
    const databases = getConfiguredDatabases(userConfig)

    if (databases.length > 0) {
      const buttons = databases.map(db => db.name)

      const { response } = await dialog.showMessageBox(parentWindow || null, {
        type: 'question',
        buttons,
        title: 'Select database',
        message:
          'A configuration file with multiple databases was found.\n\nSelect the database you want to use for this session:',
        cancelId: -1,
        noLink: true,
      })

      if (response === -1) {
        // User closed the dialog or pressed Escape
        app.quit()
        return
      }

      const selected = databases[response]
      setDatabaseFilePath(selected.path)
      return
    }
  }

  // No config file or no databases configured: fall back to default location
  const defaultPath = await getDBFilePath()
  setDatabaseFilePath(defaultPath)
}

async function createWindow(): Promise<BrowserWindow> {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 600,
    show: true, // Show immediately for better UX
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

  await loadWindowContents(mainWindow, 'index.html')

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  return mainWindow
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

  // Create and show window immediately for better UX
  const win = await createWindow()

  // Resolve database file path (may prompt user if config with multiple DBs exists)
  // Dialog will appear on top of the window
  await chooseDatabaseForSession(win)

  // Initialize database (will create DB file if it does not yet exist, then run migrations)
  await initDB()

  // Initialize IPC handlers now that database is ready
  await initIpcHandlers(win)

  // Signal to renderer that IPC handlers are ready and database is initialized
  mainWindow.webContents.send('app-ready')

  // Periodic save every 30 seconds
  setInterval(async () => {
    await periodicSaveActiveTasks()
  }, 30000)
})
