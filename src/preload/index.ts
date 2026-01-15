import { contextBridge, ipcRenderer } from 'electron'

const API = {
  // File operations
  showFileSaveDialog: async (): Promise<Electron.SaveDialogReturnValue> => {
    return await ipcRenderer.invoke('showFileSaveDialog')
  },

  // Companies
  getCompanies: async (): Promise<DBCompany[]> => {
    return await ipcRenderer.invoke('getCompanies')
  },
  addCompany: async (name: string): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('addCompany', name)
  },
  editCompany: async (
    opts: DBEditCompanyOpts,
  ): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('editCompany', opts)
  },
  deleteCompany: async (id: string): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('deleteCompany', id)
  },

  // Projects
  getProjects: async (companyId?: string): Promise<DBProject[]> => {
    return await ipcRenderer.invoke('getProjects', companyId)
  },
  addProject: async (
    name: string,
    companyId: string,
  ): Promise<{ success: boolean; id: string }> => {
    return await ipcRenderer.invoke('addProject', name, companyId)
  },
  editProject: async (
    opts: DBEditProjectOpts,
  ): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('editProject', opts)
  },
  deleteProject: async (id: string): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('deleteProject', id)
  },

  // Task Definitions
  addTaskDefinition: async (
    opts: DBAddTaskDefinitionOpts,
  ): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('addTaskDefinition', opts)
  },
  editTaskDefinition: async (
    opts: DBEditTaskDefinitionOpts,
  ): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('editTaskDefinition', opts)
  },
  deleteTaskDefinition: async (
    opts: DBDeleteTaskDefinitionOpts,
  ): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('deleteTaskDefinition', opts)
  },
  getTaskDefinitions: async (
    projectId: string,
  ): Promise<DBTaskDefinition[]> => {
    return await ipcRenderer.invoke('getTaskDefinitions', projectId)
  },
  getAllTaskDefinitions: async (): Promise<DBTaskDefinition[]> => {
    return await ipcRenderer.invoke('getAllTaskDefinitions')
  },

  // Tasks
  addTask: async (opts: DBAddTaskOpts): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('addTask', opts)
  },
  editTask: async (
    opts: DBEditTaskOpts,
  ): Promise<DBTask & { success: boolean }> => {
    return await ipcRenderer.invoke('editTask', opts)
  },
  deleteTask: async (opts: DBDeleteTaskOpts): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('deleteTask', opts)
  },
  getTaskById: async (id: string): Promise<DBTask | null> => {
    return await ipcRenderer.invoke('getTaskById', id)
  },
  getTaskByTaskDefinitionAndDate: async (
    id: string,
    date: string,
  ): Promise<DBTask | null> => {
    return await ipcRenderer.invoke('getTaskByTaskDefinitionAndDate', id, date)
  },
  getTasks: async (projectId: string): Promise<DBTask[]> => {
    return await ipcRenderer.invoke('getTasks', projectId)
  },
  getTasksByNameAndProject: async (opts: {
    taskDefinitionId: string
  }): Promise<DBTask[]> => {
    return await ipcRenderer.invoke('getTasksByNameAndProject', opts)
  },
  getTasksToday: async (projectId: string): Promise<DBTask[]> => {
    return await ipcRenderer.invoke('getTasksToday', projectId)
  },

  // Active Tasks
  getActiveTasks: async (): Promise<ActiveTask[]> => {
    return await ipcRenderer.invoke('getActiveTasks')
  },
  startActiveTask: async (
    opts: ActiveTask,
  ): Promise<ActiveTask & { success: boolean }> => {
    return await ipcRenderer.invoke('startActiveTask', opts)
  },
  pauseActiveTask: async (
    opts: ActiveTask,
  ): Promise<ActiveTask & { success: boolean }> => {
    return await ipcRenderer.invoke('pauseActiveTask', opts)
  },
  stopActiveTask: async (
    opts: ActiveTask,
  ): Promise<(ActiveTask & { success: true }) | { success: false }> => {
    return await ipcRenderer.invoke('stopActiveTask', opts)
  },

  // PDF Export
  getDataForPDFExport: async (opts: PDFQuery): Promise<PDFQueryResult[]> => {
    return await ipcRenderer.invoke('getDataForPDFExport', opts)
  },

  // Search
  getSearchResult: async (query: SearchQuery): Promise<SearchQueryResult> => {
    return await ipcRenderer.invoke('getSearchResult', query)
  },

  // Events
  on: (channel: string, callback: (data: unknown) => void) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
  off: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
}

try {
  contextBridge.exposeInMainWorld('electron', API)
} catch (error) {
  console.error(error)
}
