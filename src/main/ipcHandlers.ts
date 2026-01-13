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

  const getActiveTasks = async (): Promise<ActiveTask[]> => {
    return Promise.all(
      activeTasks.map(async t => {
        // Fetch task details from database to include name and projectName
        const task = await DB.task.findUnique({
          where: { id: parseInt(t.taskId) },
          include: {
            taskDefinition: {
              include: {
                project: true,
              },
            },
          },
        })
        return {
          taskId: t.taskId,
          description: t.description,
          date: t.date,
          seconds: t.seconds,
          isActive: t.isActive,
          name: task?.taskDefinition.name || '',
          projectName: task?.taskDefinition.project.name || '',
        }
      }),
    )
  }

  const addActiveTask = (task: ActiveTask) => {
    const countup = new CountUp({
      taskId: task.taskId,
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
      t => t.taskId === opts.taskId && t.date === opts.date,
    )
    return task || null
  }

  const startActiveTask = async (
    opts: ActiveTask,
  ): Promise<ActiveTask & { success: boolean }> => {
    const task = getActiveTask(opts)
    if (!task) {
      const addedTask = addActiveTask({
        taskId: opts.taskId,
        description: opts.description,
        date: opts.date,
        seconds: opts.seconds,
        isActive: true,
      })
      addedTask.start()
      // Fetch task details for response
      const dbTask = await DB.task.findUnique({
        where: { id: parseInt(opts.taskId) },
        include: {
          taskDefinition: {
            include: {
              project: true,
            },
          },
        },
      })
      return {
        success: true,
        taskId: opts.taskId,
        description: opts.description,
        date: opts.date,
        seconds: opts.seconds,
        isActive: true,
        name: dbTask?.taskDefinition.name || '',
        projectName: dbTask?.taskDefinition.project.name || '',
      }
    }
    if (task.isActive) {
      console.warn('task already active', opts)
      const dbTask = await DB.task.findUnique({
        where: { id: parseInt(opts.taskId) },
        include: {
          taskDefinition: {
            include: {
              project: true,
            },
          },
        },
      })
      return {
        success: false,
        taskId: opts.taskId,
        description: task.description,
        date: task.date,
        seconds: task.seconds,
        isActive: true,
        name: dbTask?.taskDefinition.name || '',
        projectName: dbTask?.taskDefinition.project.name || '',
      }
    } else {
      task.start()
      const dbTask = await DB.task.findUnique({
        where: { id: parseInt(opts.taskId) },
        include: {
          taskDefinition: {
            include: {
              project: true,
            },
          },
        },
      })
      return {
        success: true,
        taskId: opts.taskId,
        description: task.description,
        date: task.date,
        seconds: task.seconds,
        isActive: true,
        name: dbTask?.taskDefinition.name || '',
        projectName: dbTask?.taskDefinition.project.name || '',
      }
    }
  }

  const stopActiveTask = async (
    opts: ActiveTask,
  ): Promise<(ActiveTask & { success: true }) | { success: false }> => {
    const task = getActiveTask(opts)
    if (!task) {
      console.error('task not found', opts)
      return { success: false }
    }
    task.stop()
    // Save using taskId directly
    await saveActiveTask(DB, {
      taskId: task.taskId,
      date: task.date,
      seconds: task.seconds,
    })
    const idx = activeTasks.findIndex(
      t => t.taskId === opts.taskId && t.date === opts.date,
    )
    const f = activeTasks.find(
      t => t.taskId === opts.taskId && t.date === opts.date,
    )
    if (f) {
      const clone = Object.assign({}, f)
      activeTasks.splice(idx, 1)
      // Fetch task details for response
      const dbTask = await DB.task.findUnique({
        where: { id: parseInt(clone.taskId) },
        include: {
          taskDefinition: {
            include: {
              project: true,
            },
          },
        },
      })
      return {
        success: true,
        taskId: clone.taskId,
        description: clone.description,
        date: clone.date,
        seconds: clone.seconds,
        isActive: false,
        name: dbTask?.taskDefinition.name || '',
        projectName: dbTask?.taskDefinition.project.name || '',
      }
    } else {
      return { success: false }
    }
  }

  const pauseActiveTask = async (
    opts: ActiveTask,
  ): Promise<(ActiveTask & { success: true }) | { success: false }> => {
    const task = getActiveTask(opts)
    if (!task) {
      console.error('task not found', opts)
      return { success: false }
    }
    task.pause()
    // Save using taskId directly
    await saveActiveTask(DB, {
      taskId: task.taskId,
      date: task.date,
      seconds: task.seconds,
    })
    // Fetch task details for response
    const dbTask = await DB.task.findUnique({
      where: { id: parseInt(task.taskId) },
      include: {
        taskDefinition: {
          include: {
            project: true,
          },
        },
      },
    })
    return {
      success: true,
      taskId: task.taskId,
      description: task.description,
      date: task.date,
      seconds: task.seconds,
      isActive: false,
      name: dbTask?.taskDefinition.name || '',
      projectName: dbTask?.taskDefinition.project.name || '',
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
  ipcMain.handle('deleteCompany', async (_, id: string) =>
    deleteCompany(DB, id),
  )

  // Project handlers
  ipcMain.handle('getProjects', async (_, companyId?: string) =>
    getProjects(DB, companyId),
  )
  ipcMain.handle('addProject', async (_, name: string, companyId: string) =>
    addProject(DB, name, companyId),
  )
  ipcMain.handle('editProject', async (_, opts: DBEditProjectOpts) =>
    editProject(DB, opts),
  )
  ipcMain.handle('deleteProject', async (_, id: string) =>
    deleteProject(DB, id),
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
  ipcMain.handle('getTaskDefinitions', async (_, projectId: string) =>
    getTaskDefinitions(DB, projectId),
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
  ipcMain.handle('getTasks', async (_, projectId: string) =>
    getTasks(DB, projectId),
  )
  ipcMain.handle(
    'getTasksByNameAndProject',
    async (_, opts: { taskDefinitionId: string }) =>
      getTasksByNameAndProject(DB, opts),
  )
  ipcMain.handle('getTasksToday', async (_, projectId: string) =>
    getTasksToday(DB, projectId),
  )
  ipcMain.handle('getActiveTasks', async () => getActiveTasks())
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

export const getActiveTasksForSave = (): Array<{
  taskId: string
  date: string
  seconds: number
}> => {
  return activeTasks.map(t => ({
    taskId: t.taskId,
    date: t.date,
    seconds: t.seconds,
  }))
}

export const periodicSaveActiveTasks = async (db: PrismaClient) => {
  const activeTasksToSave = getActiveTasksForSave()
  // Now we can use taskId directly
  const validTasks = activeTasksToSave.map(task => ({
    taskId: task.taskId,
    date: task.date,
    seconds: task.seconds,
  }))

  await saveActiveTasks(db, validTasks)
}
