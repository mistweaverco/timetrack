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
  deleteCompany: async (name: string): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('deleteCompany', name)
  },

  // Projects
  getProjects: async (companyName?: string): Promise<DBProject[]> => {
    return await ipcRenderer.invoke('getProjects', companyName)
  },
  addProject: async (
    name: string,
    companyName: string,
  ): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('addProject', name, companyName)
  },
  editProject: async (
    opts: DBEditProjectOpts,
  ): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('editProject', opts)
  },
  deleteProject: async (name: string): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('deleteProject', name)
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
    project_name: string,
  ): Promise<DBTaskDefinition[]> => {
    return await ipcRenderer.invoke('getTaskDefinitions', project_name)
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
  getTasks: async (project_name: string): Promise<DBTask[]> => {
    return await ipcRenderer.invoke('getTasks', project_name)
  },
  getTasksByNameAndProject: async (opts: {
    name: string
    project_name: string
  }): Promise<DBTask[]> => {
    return await ipcRenderer.invoke('getTasksByNameAndProject', opts)
  },
  getTasksToday: async (project_name: string): Promise<DBTask[]> => {
    return await ipcRenderer.invoke('getTasksToday', project_name)
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
  on: (channel: string, callback: (data: any) => void) => {
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
