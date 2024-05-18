import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  IpcMainInvokeEvent,
} from 'electron'
import moment from 'moment'
import fs from 'fs'
import path from 'path'
import { Database } from 'sqlite'
import { CountUp } from './countup'
import { windowsInstallerSetupEvents } from './installer-setup-events'
import {
  initDB,
  getProjects,
  addProject,
  editProject,
  deleteProject,
  addTaskDefinition,
  editTaskDefinition,
  deleteTaskDefinition,
  getTaskDefinitions,
  getAllTaskDefinitions,
  addTask,
  editTask,
  deleteTask,
  getTasks,
  getTasksByNameAndProject,
  getTasksToday,
  saveActiveTasks,
  saveActiveTask,
  getDataForPDFExport,
  getSearchResult,
} from './database'

if (require('electron-squirrel-startup')) app.quit()
// if first time install on windows, do not run application, rather
// let squirrel installer do its work
if (windowsInstallerSetupEvents()) {
  process.exit()
}

let WINDOW: BrowserWindow = null
let DB: Database
const activeTasks: InstanceType<typeof CountUp>[] = []

const getPDFExport = async (evt: IpcMainInvokeEvent, filepath: string) => {
  const win = BrowserWindow.fromWebContents(evt.sender)
  const options = {}
  const pdfWriterResult = await win.webContents.printToPDF(options)
  fs.writeFileSync(filepath, pdfWriterResult)
  evt.sender.send('on-pdf-export-file-saved', filepath)
  shell.openExternal('file://' + filepath)
}

const createWindow = async () => {
  WINDOW = new BrowserWindow({
    width: 960,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    WINDOW.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
    WINDOW.webContents.openDevTools()
    WINDOW.maximize()
  } else {
    WINDOW.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    )
  }

  WINDOW.setMenuBarVisibility(false)

  // open external links in default browser
  WINDOW.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.commandLine.appendSwitch('disable-gpu-vsync')

const getActiveTasks = (): ActiveTask[] => {
  const tasks = activeTasks.map(t => {
    return {
      name: t.name,
      project_name: t.project_name,
      description: t.description,
      date: t.date,
      seconds: t.seconds,
      isActive: t.isActive,
    }
  })
  return tasks
}

const periodicSaveActiveTasks = async () => {
  const tasks = getActiveTasks()
  saveActiveTasks(DB, tasks)
}

const startActiveTask = (
  opts: ActiveTask,
): ActiveTask & { success: boolean } => {
  const task = getActiveTask(opts)
  if (!task) {
    const addedTask = addActiveTask({
      name: opts.name,
      description: opts.description,
      project_name: opts.project_name,
      date: opts.date,
      seconds: opts.seconds,
      isActive: true,
    })
    addedTask.start()
    return {
      success: true,
      project_name: addedTask.project_name,
      description: addedTask.description,
      name: addedTask.name,
      date: addedTask.date,
      seconds: addedTask.seconds,
      isActive: true,
    }
  }
  if (task.isActive) {
    console.warn('task already active', opts)
    return {
      success: false,
      project_name: task.project_name,
      description: task.description,
      name: task.name,
      date: task.date,
      seconds: task.seconds,
      isActive: true,
    }
  } else {
    task.start()
    return {
      success: true,
      project_name: task.project_name,
      description: task.description,
      name: task.name,
      date: task.date,
      seconds: task.seconds,
      isActive: true,
    }
  }
}

const stopActiveTask = (
  opts: ActiveTask,
): (ActiveTask & { success: true }) | { success: false } => {
  const task = getActiveTask(opts)
  if (!task) {
    console.error('task not found', opts)
    return { success: false }
  }
  task.stop()
  saveActiveTask(DB, {
    name: task.name,
    project_name: task.project_name,
    date: task.date,
    seconds: task.seconds,
  })
  const idx = activeTasks.findIndex(
    t =>
      t.name === opts.name &&
      t.project_name === opts.project_name &&
      t.date === opts.date,
  )
  const f = activeTasks.find(
    t =>
      t.name === opts.name &&
      t.project_name === opts.project_name &&
      t.date === opts.date,
  )
  if (f) {
    const clone = Object.assign({}, f)
    activeTasks.splice(idx, 1)
    return {
      success: true,
      project_name: clone.project_name,
      description: clone.description,
      name: clone.name,
      date: clone.date,
      seconds: clone.seconds,
      isActive: false,
    }
  } else {
    return { success: false }
  }
}

const pauseActiveTask = (
  opts: ActiveTask,
): (ActiveTask & { success: true }) | { success: false } => {
  const task = getActiveTask(opts)
  if (!task) {
    console.error('task not found', opts)
    return { success: false }
  }
  task.pause()
  saveActiveTask(DB, {
    name: task.name,
    project_name: task.project_name,
    date: task.date,
    seconds: task.seconds,
  })
  return {
    success: true,
    name: task.name,
    project_name: task.project_name,
    description: task.description,
    date: task.date,
    seconds: task.seconds,
    isActive: false,
  }
}

const addActiveTask = (task: ActiveTask) => {
  const countup = new CountUp({
    name: task.name,
    project_name: task.project_name,
    description: task.description,
    date: task.date,
    seconds: task.seconds,
  })
  activeTasks.push(countup)
  return countup
}

const getActiveTask = (
  opts: MainProcessManageActiveTasksOpts,
): InstanceType<typeof CountUp> => {
  const task = activeTasks.find(
    t =>
      t.name === opts.name &&
      t.project_name === opts.project_name &&
      t.date === opts.date,
  )
  if (task) {
    return task
  }
  return null
}

const setupIPCHandles = async () => {
  const ipcHandles: MainProcessIPCHandle[] = [
    {
      id: 'showFileSaveDialog',
      cb: async (evt: IpcMainInvokeEvent) => {
        const datestr = moment().format('YYYY-MM-DD')
        const dialogResult = await dialog.showSaveDialog(WINDOW, {
          properties: ['showOverwriteConfirmation'],
          defaultPath: `timetrack-report-${datestr}.pdf`,
        })
        evt.sender.send('on-pdf-export-file-selected', dialogResult)
        if (dialogResult.canceled) {
          return
        }
        getPDFExport(evt, dialogResult.filePath)
      },
    },
    {
      id: 'getProjects',
      cb: async () => {
        const json = await getProjects(DB)
        return json
      },
    },
    {
      id: 'addProject',
      cb: async (_: string, name: string) => {
        const json = await addProject(DB, name)
        return json
      },
    },
    {
      id: 'editProject',
      cb: async (_: string, opts: DBEditProjectOpts) => {
        const json = await editProject(DB, opts)
        return json
      },
    },
    {
      id: 'deleteProject',
      cb: async (_: string, name: string) => {
        const json = await deleteProject(DB, name)
        return json
      },
    },
    {
      id: 'addTaskDefinition',
      cb: async (_: string, opts: DBAddTaskDefinitionOpts) => {
        const json = await addTaskDefinition(DB, opts)
        return json
      },
    },
    {
      id: 'editTaskDefinition',
      cb: async (_: string, opts: DBEditTaskDefinitionOpts) => {
        const json = await editTaskDefinition(DB, opts)
        return json
      },
    },
    {
      id: 'deleteTaskDefinition',
      cb: async (_: string, opts: DBDeleteTaskDefinitionOpts) => {
        const json = await deleteTaskDefinition(DB, opts)
        return json
      },
    },
    {
      id: 'getTaskDefinitions',
      cb: async (_: string, name: string) => {
        const tasks = await getTaskDefinitions(DB, name)
        return tasks
      },
    },
    {
      id: 'getAllTaskDefinitions',
      cb: async () => {
        const res = await getAllTaskDefinitions(DB)
        return res
      },
    },
    {
      id: 'addTask',
      cb: async (_: string, opts: DBAddTaskOpts) => {
        const json = await addTask(DB, opts)
        return json
      },
    },
    {
      id: 'editTask',
      cb: async (_: string, opts: DBEditTaskOpts) => {
        await editTask(DB, opts)
        return {
          ...opts,
          success: true,
        }
      },
    },
    {
      id: 'deleteTask',
      cb: async (_: string, opts: DBDeleteTaskOpts) => {
        const json = await deleteTask(DB, opts)
        return json
      },
    },
    {
      id: 'getTasks',
      cb: async (_: string, name: string) => {
        const json = await getTasks(DB, name)
        return json
      },
    },
    {
      id: 'getTasksByNameAndProject',
      cb: async (_: string, opts: { name: string, project_name: string }) => {
        const json = await getTasksByNameAndProject(DB, opts)
        return json
      },
    },
    {
      id: 'getTasksToday',
      cb: async (_: string, name: string) => {
        const json = await getTasksToday(DB, name)
        return json
      },
    },
    {
      id: 'getActiveTasks',
      cb: () => {
        const json = getActiveTasks()
        return json
      },
    },
    {
      id: 'startActiveTask',
      cb: async (_: string, opts: ActiveTask) => {
        const json = startActiveTask(opts)
        return json
      },
    },
    {
      id: 'pauseActiveTask',
      cb: async (_: string, opts: ActiveTask) => {
        const json = pauseActiveTask(opts)
        return json
      },
    },
    {
      id: 'stopActiveTask',
      cb: async (_: string, opts: ActiveTask) => {
        const json = stopActiveTask(opts)
        return json
      },
    },
    {
      id: 'getDataForPDFExport',
      cb: async (_: string, opts: PDFQuery) => {
        const json = getDataForPDFExport(DB, opts)
        return json
      },
    },
    {
      id: 'getSearchResult',
      cb: async (_: string, opts: SearchQuery) => {
        const json = getSearchResult(DB, opts)
        return json
      },
    },
  ]
  ipcHandles.forEach(async h => {
    ipcMain.handle(h.id, h.cb)
  })
}

const onWhenReady = async () => {
  DB = await initDB()

  await setupIPCHandles()

  setInterval(async () => {
    await periodicSaveActiveTasks()
  }, 30000)

  createWindow()
}

app.whenReady().then(onWhenReady)

const onWindowAllClosed = async () => {
  await periodicSaveActiveTasks()
  DB.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
}

app.on('window-all-closed', onWindowAllClosed)
