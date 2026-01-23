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
  getTaskById,
  getTaskByTaskDefinitionAndDate,
  getTaskDefinitions,
  getTasks,
  getTasksByNameAndProject,
  getTasksToday,
  saveActiveTask,
  saveActiveTasks,
  getDatabase,
} from '../database'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { task, taskDefinition, project, company } from '../db/schema'
import { eq } from 'drizzle-orm'

let DB: ReturnType<typeof drizzle>
let WINDOW: BrowserWindow
const activeTasks: InstanceType<typeof CountUp>[] = []

export const initIpcHandlers = async (
  mainWindow: BrowserWindow,
): Promise<void> => {
  WINDOW = mainWindow
  DB = await getDatabase()

  const getActiveTasks = async (): Promise<ActiveTask[]> => {
    return Promise.all(
      activeTasks.map(async t => {
        // Fetch task details from database to include name and projectName
        const taskResult = await DB.select({
          taskDefinitionName: taskDefinition.name,
          projectName: project.name,
          companyName: company.name,
        })
          .from(task)
          .innerJoin(
            taskDefinition,
            eq(task.taskDefinitionId, taskDefinition.id),
          )
          .innerJoin(project, eq(taskDefinition.projectId, project.id))
          .innerJoin(company, eq(project.companyId, company.id))
          .where(eq(task.id, parseInt(t.taskId, 10)))
          .limit(1)

        const taskData = taskResult[0]
        return {
          taskId: t.taskId,
          description: t.description,
          date: t.date,
          seconds: t.seconds,
          isActive: t.isActive,
          name: taskData?.taskDefinitionName || '',
          projectName: taskData?.projectName || '',
          companyName: taskData?.companyName || '',
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

  const getActiveTask = (id: string): InstanceType<typeof CountUp> | null => {
    return activeTasks.find(t => t.taskId === id) || null
  }

  const startActiveTask = async (
    id: string,
  ): Promise<ActiveTask & { success: boolean }> => {
    const activeTask = getActiveTask(id)
    if (!activeTask) {
      // Fetch task details for response
      const dbTaskResult = await DB.select({
        taskDefinitionName: taskDefinition.name,
        projectName: project.name,
        companyName: company.name,
        description: task.description,
        date: task.date,
        seconds: task.seconds,
      })
        .from(task)
        .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
        .innerJoin(project, eq(taskDefinition.projectId, project.id))
        .innerJoin(company, eq(project.companyId, company.id))
        .where(eq(task.id, parseInt(id, 10)))
        .limit(1)

      const dbTask = dbTaskResult[0]
      if (!dbTask) {
        throw new Error(`Task not found: ${id}`)
      }

      const addedTask = addActiveTask({
        name: dbTask.taskDefinitionName,
        companyName: dbTask.companyName,
        projectName: dbTask.projectName,
        taskId: id,
        description: dbTask.description || '',
        date: dbTask.date.toISOString(),
        seconds: dbTask.seconds,
        isActive: true,
      })
      addedTask.start()
      return {
        success: true,
        taskId: id,
        description: dbTask.taskDefinitionName,
        date: dbTask.date.toISOString(),
        seconds: dbTask.seconds,
        isActive: true,
        name: dbTask.taskDefinitionName,
        projectName: dbTask.projectName,
        companyName: dbTask.companyName,
      }
    }
    if (activeTask.isActive) {
      console.warn('task already active', id)
      const dbTaskResult = await DB.select({
        taskDefinitionName: taskDefinition.name,
        projectName: project.name,
        companyName: company.name,
        date: task.date,
      })
        .from(task)
        .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
        .innerJoin(project, eq(taskDefinition.projectId, project.id))
        .innerJoin(company, eq(project.companyId, company.id))
        .where(eq(task.id, parseInt(id, 10)))
        .limit(1)

      const dbTask = dbTaskResult[0]
      if (!dbTask) {
        throw new Error(`Task not found: ${id}`)
      }

      return {
        success: false,
        taskId: id,
        description: activeTask.description,
        date: dbTask.date.toISOString(),
        seconds: activeTask.seconds,
        isActive: true,
        name: dbTask.taskDefinitionName,
        projectName: dbTask.projectName,
        companyName: dbTask.companyName,
      }
    } else {
      activeTask.start()
      const dbTaskResult = await DB.select({
        taskDefinitionName: taskDefinition.name,
        projectName: project.name,
        companyName: company.name,
        date: task.date,
      })
        .from(task)
        .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
        .innerJoin(project, eq(taskDefinition.projectId, project.id))
        .innerJoin(company, eq(project.companyId, company.id))
        .where(eq(task.id, parseInt(id, 10)))
        .limit(1)

      const dbTask = dbTaskResult[0]
      if (!dbTask) {
        throw new Error(`Task not found: ${id}`)
      }

      return {
        success: true,
        taskId: id,
        description: activeTask.description,
        date: dbTask.date.toISOString(),
        seconds: activeTask.seconds,
        isActive: true,
        name: dbTask.taskDefinitionName,
        projectName: dbTask.projectName,
        companyName: dbTask.companyName,
      }
    }
  }

  const stopActiveTask = async (
    id: string,
  ): Promise<(ActiveTask & { success: true }) | { success: false }> => {
    const activeTask = getActiveTask(id)
    if (!activeTask) {
      console.error('task not found', id)
      return { success: false }
    }
    activeTask.stop()
    // Save using taskId directly
    await saveActiveTask(DB, {
      taskId: activeTask.taskId,
      date: activeTask.date,
      seconds: activeTask.seconds,
    })
    const idx = activeTasks.findIndex(t => t.taskId === id)
    const f = activeTasks.find(t => t.taskId === id)
    if (f) {
      const clone = Object.assign({}, f)
      activeTasks.splice(idx, 1)
      // Fetch task details for response
      const dbTaskResult = await DB.select({
        taskDefinitionName: taskDefinition.name,
        projectName: project.name,
        companyName: company.name,
        date: task.date,
      })
        .from(task)
        .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
        .innerJoin(project, eq(taskDefinition.projectId, project.id))
        .innerJoin(company, eq(project.companyId, company.id))
        .where(eq(task.id, parseInt(activeTask.taskId, 10)))
        .limit(1)

      const dbTask = dbTaskResult[0]
      if (!dbTask) {
        throw new Error(`Task not found: ${activeTask.taskId}`)
      }

      return {
        success: true,
        taskId: id,
        description: clone.description,
        date: dbTask.date.toISOString(),
        seconds: clone.seconds,
        isActive: false,
        name: dbTask.taskDefinitionName,
        projectName: dbTask.projectName,
        companyName: dbTask.companyName,
      }
    } else {
      return { success: false }
    }
  }

  const pauseActiveTask = async (
    id: string,
  ): Promise<(ActiveTask & { success: true }) | { success: false }> => {
    const activeTask = getActiveTask(id)
    if (!activeTask) {
      console.error('task not found', id)
      return { success: false }
    }
    activeTask.pause()
    // Save using taskId directly
    await saveActiveTask(DB, {
      taskId: activeTask.taskId,
      date: activeTask.date,
      seconds: activeTask.seconds,
    })
    // Fetch task details for response
    const dbTaskResult = await DB.select({
      taskDefinitionName: taskDefinition.name,
      projectName: project.name,
      companyName: company.name,
      date: task.date,
    })
      .from(task)
      .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
      .innerJoin(project, eq(taskDefinition.projectId, project.id))
      .innerJoin(company, eq(project.companyId, company.id))
      .where(eq(task.id, parseInt(activeTask.taskId)))
      .limit(1)

    const dbTask = dbTaskResult[0]
    if (!dbTask) {
      throw new Error(`Task not found: ${activeTask.taskId}`)
    }

    return {
      success: true,
      taskId: activeTask.taskId,
      description: activeTask.description,
      date: dbTask.date.toISOString(),
      seconds: activeTask.seconds,
      isActive: false,
      name: dbTask.taskDefinitionName,
      projectName: dbTask.projectName,
      companyName: dbTask.companyName,
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
    // Buffer is compatible with writeFileSync, but TypeScript types are strict
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fs.writeFileSync(filepath, pdfWriterResult as any)
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
  ipcMain.handle('getTaskById', async (_, id: string) => getTaskById(DB, id))
  ipcMain.handle(
    'getTaskByTaskDefinitionAndDate',
    async (_, id: string, date: string) =>
      getTaskByTaskDefinitionAndDate(DB, id, date),
  )
  ipcMain.handle('getTasksToday', async (_, projectId: string) =>
    getTasksToday(DB, projectId),
  )
  ipcMain.handle('getActiveTasks', async () => getActiveTasks())
  ipcMain.handle('startActiveTask', async (_, id: string) =>
    startActiveTask(id),
  )
  ipcMain.handle('pauseActiveTask', async (_, id: string) =>
    pauseActiveTask(id),
  )
  ipcMain.handle('stopActiveTask', async (_, id: string) => stopActiveTask(id))
  ipcMain.handle('getDataForPDFExport', async (_, opts: PDFQuery) =>
    getDataForPDFExport(DB, opts),
  )
  ipcMain.handle('getSearchResult', async (_, opts: SearchQuery) =>
    getSearchResult(DB, opts),
  )

  // Signal to renderer that IPC handlers are ready and database is initialized
  mainWindow.webContents.send('app-ready')
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

export const periodicSaveActiveTasks = async () => {
  const activeTasksToSave = getActiveTasksForSave()
  // Now we can use taskId directly
  const validTasks = activeTasksToSave.map(task => ({
    taskId: task.taskId,
    date: task.date,
    seconds: task.seconds,
  }))

  await saveActiveTasks(DB, validTasks)
}
