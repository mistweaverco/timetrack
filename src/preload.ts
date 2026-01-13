import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
})

type ElectronOnCallback = {
  (data: any): void // eslint-disable-line @typescript-eslint/no-explicit-any
}

contextBridge.exposeInMainWorld('electron', {
  on: (channel: string, callback: ElectronOnCallback) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
  off: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  },
  showFileSaveDialog: () =>
    ipcRenderer.invoke('showFileSaveDialog').then(result => result),
  addProject: (name: string, companyId: string) =>
    ipcRenderer.invoke('addProject', name, companyId).then(result => result),
  editProject: opts =>
    ipcRenderer.invoke('editProject', opts).then(result => result),
  deleteProject: (id: string) =>
    ipcRenderer.invoke('deleteProject', id).then(result => result),
  getProjects: (companyId?: string) =>
    ipcRenderer.invoke('getProjects', companyId).then(result => result),
  addTaskDefinition: opts =>
    ipcRenderer.invoke('addTaskDefinition', opts).then(result => result),
  editTaskDefinition: opts =>
    ipcRenderer.invoke('editTaskDefinition', opts).then(result => result),
  deleteTaskDefinition: opts =>
    ipcRenderer.invoke('deleteTaskDefinition', opts).then(result => result),
  getTaskDefinitions: (projectId: string) =>
    ipcRenderer.invoke('getTaskDefinitions', projectId).then(result => result),
  getAllTaskDefinitions: () =>
    ipcRenderer.invoke('getAllTaskDefinitions').then(result => result),
  addTask: opts => ipcRenderer.invoke('addTask', opts).then(result => result),
  editTask: opts => ipcRenderer.invoke('editTask', opts).then(result => result),
  deleteTask: opts =>
    ipcRenderer.invoke('deleteTask', opts).then(result => result),
  getTasks: (projectId: string) =>
    ipcRenderer.invoke('getTasks', projectId).then(result => result),
  getTasksByNameAndProject: (opts: { taskDefinitionId: string }) =>
    ipcRenderer.invoke('getTasksByNameAndProject', opts).then(result => result),
  getTasksToday: (projectId: string) =>
    ipcRenderer.invoke('getTasksToday', projectId).then(result => result),
  getActiveTasks: () =>
    ipcRenderer.invoke('getActiveTasks').then(result => result),
  startActiveTask: (opts: ActiveTask) =>
    ipcRenderer.invoke('startActiveTask', opts).then(result => result),
  pauseActiveTask: (opts: ActiveTask) =>
    ipcRenderer.invoke('pauseActiveTask', opts).then(result => result),
  stopActiveTask: (opts: ActiveTask) =>
    ipcRenderer.invoke('stopActiveTask', opts).then(result => result),
  getDataForPDFExport: (opts: PDFQuery) =>
    ipcRenderer.invoke('getDataForPDFExport', opts).then(result => result),
  getPDFExport: (filepath: string) =>
    ipcRenderer.invoke('getPDFExport', filepath).then(result => result),
  getSearchResult: (query: SearchQuery) =>
    ipcRenderer.invoke('getSearchResult', query).then(result => result),
})
