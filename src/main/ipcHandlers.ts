import {
  BrowserWindow,
  dialog,
  ipcMain,
  IpcMainInvokeEvent,
  shell,
} from 'electron'
import moment from 'moment'
import fs from 'fs'
import { CountUp } from '../countup'
import {
  addCompany,
  addProject,
  addTask,
  addTaskDefinition,
  deleteCompany,
  deleteProject,
  deleteTask,
  deleteTaskDefinition,
  editCompany,
  editProject,
  editTask,
  editTaskDefinition,
  getAllTaskDefinitions,
  getCompanies,
  getDataForPDFExport,
  getProjects,
  getSearchResult,
  getTaskDefinitions,
  getTasks,
  getTasksByNameAndProject,
  getTasksToday,
  PrismaClient,
  saveActiveTask,
  saveActiveTasks,
} from '../database'

let DB: PrismaClient
let WINDOW: BrowserWindow
const activeTasks: InstanceType<typeof CountUp>[] = []

export const initIpcHandlers = (
  mainWindow: BrowserWindow,
  db: PrismaClient,
): void => {
  WINDOW = mainWindow
  DB = db

  const getActiveTasks = (): ActiveTask[] => {
    return activeTasks.map(t => ({
      name: t.name,
      project_name: t.project_name,
      description: t.description,
      date: t.date,
      seconds: t.seconds,
      isActive: t.isActive,
    }))
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
  ): InstanceType<typeof CountUp> | null => {
    const task = activeTasks.find(
      t =>
        t.name === opts.name &&
        t.project_name === opts.project_name &&
        t.date === opts.date,
    )
    return task || null
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

  const getPDFExport = async (evt: IpcMainInvokeEvent, filepath: string) => {
    const win = BrowserWindow.fromWebContents(evt.sender)
    if (!win) {
      console.error('No window found for PDF export')
      return
    }
    const options = {}
    const pdfWriterResult = await win.webContents.printToPDF(options)
    fs.writeFileSync(filepath, pdfWriterResult)
    evt.sender.send('on-pdf-export-file-saved', filepath)
    shell.openExternal('file://' + filepath)
  }

  // IPC Handlers
  ipcMain.handle('showFileSaveDialog', async () => {
    const datestr = moment().format('YYYY-MM-DD')
    const dialogResult = await dialog.showSaveDialog(WINDOW, {
      properties: ['showOverwriteConfirmation'],
      defaultPath: `timetrack-report-${datestr}.pdf`,
    })
    if (!dialogResult.canceled && dialogResult.filePath) {
      WINDOW.webContents.send('on-pdf-export-file-selected', dialogResult)
      await getPDFExport(
        { sender: WINDOW.webContents } as IpcMainInvokeEvent,
        dialogResult.filePath,
      )
    } else {
      WINDOW.webContents.send('on-pdf-export-file-selected', dialogResult)
    }
    return dialogResult
  })

  // Company handlers
  ipcMain.handle('getCompanies', async () => getCompanies(DB))
  ipcMain.handle('addCompany', async (_, name: string) => addCompany(DB, name))
  ipcMain.handle('editCompany', async (_, opts: DBEditCompanyOpts) =>
    editCompany(DB, opts),
  )
  ipcMain.handle('deleteCompany', async (_, name: string) =>
    deleteCompany(DB, name),
  )

  // Project handlers
  ipcMain.handle('getProjects', async (_, companyName?: string) =>
    getProjects(DB, companyName),
  )
  ipcMain.handle('addProject', async (_, name: string, companyName: string) =>
    addProject(DB, name, companyName),
  )
  ipcMain.handle('editProject', async (_, opts: DBEditProjectOpts) =>
    editProject(DB, opts),
  )
  ipcMain.handle('deleteProject', async (_, name: string) =>
    deleteProject(DB, name),
  )
  ipcMain.handle(
    'addTaskDefinition',
    async (_, opts: DBAddTaskDefinitionOpts) => addTaskDefinition(DB, opts),
  )
  ipcMain.handle(
    'editTaskDefinition',
    async (_, opts: DBEditTaskDefinitionOpts) => editTaskDefinition(DB, opts),
  )
  ipcMain.handle(
    'deleteTaskDefinition',
    async (_, opts: DBDeleteTaskDefinitionOpts) =>
      deleteTaskDefinition(DB, opts),
  )
  ipcMain.handle('getTaskDefinitions', async (_, name: string) =>
    getTaskDefinitions(DB, name),
  )
  ipcMain.handle('getAllTaskDefinitions', async () => getAllTaskDefinitions(DB))
  ipcMain.handle('addTask', async (_, opts: DBAddTaskOpts) => addTask(DB, opts))
  ipcMain.handle('editTask', async (_, opts: DBEditTaskOpts) => {
    await editTask(DB, opts)
    return { ...opts, success: true }
  })
  ipcMain.handle('deleteTask', async (_, opts: DBDeleteTaskOpts) =>
    deleteTask(DB, opts),
  )
  ipcMain.handle('getTasks', async (_, name: string) => getTasks(DB, name))
  ipcMain.handle(
    'getTasksByNameAndProject',
    async (_, opts: { name: string; project_name: string }) =>
      getTasksByNameAndProject(DB, opts),
  )
  ipcMain.handle('getTasksToday', async (_, name: string) =>
    getTasksToday(DB, name),
  )
  ipcMain.handle('getActiveTasks', () => getActiveTasks())
  ipcMain.handle('startActiveTask', async (_, opts: ActiveTask) =>
    startActiveTask(opts),
  )
  ipcMain.handle('pauseActiveTask', async (_, opts: ActiveTask) =>
    pauseActiveTask(opts),
  )
  ipcMain.handle('stopActiveTask', async (_, opts: ActiveTask) =>
    stopActiveTask(opts),
  )
  ipcMain.handle('getDataForPDFExport', async (_, opts: PDFQuery) =>
    getDataForPDFExport(DB, opts),
  )
  ipcMain.handle('getSearchResult', async (_, opts: SearchQuery) =>
    getSearchResult(DB, opts),
  )
}

export const getActiveTasksForSave = (): ActiveTask[] => {
  return activeTasks.map(t => ({
    name: t.name,
    project_name: t.project_name,
    description: t.description,
    date: t.date,
    seconds: t.seconds,
    isActive: t.isActive,
  }))
}

export const periodicSaveActiveTasks = async (db: PrismaClient) => {
  const tasks = getActiveTasksForSave()
  await saveActiveTasks(db, tasks)
}
