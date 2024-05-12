import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})

contextBridge.exposeInMainWorld('electron', {
  addProject: (name: string) => ipcRenderer.invoke('addProject', name).then(result => result),
  editProject: (opts) => ipcRenderer.invoke('editProject', opts).then(result => result),
  deleteProject: (name: string) => ipcRenderer.invoke('deleteProject', name).then(result => result),
  getProjects: () => ipcRenderer.invoke('getProjects').then(result => result),
  addTaskDefinition: (opts) => ipcRenderer.invoke('addTaskDefinition', opts).then(result => result),
  editTaskDefinition: (opts) => ipcRenderer.invoke('editTaskDefinition', opts).then(result => result),
  deleteTaskDefinition: (opts) => ipcRenderer.invoke('deleteTaskDefinition', opts).then(result => result),
  getTaskDefinitions: (projectName: string) => ipcRenderer.invoke('getTaskDefinitions', projectName).then(result => result),
  addTask: (opts) => ipcRenderer.invoke('addTask', opts).then(result => result),
  editTask: (opts) => ipcRenderer.invoke('editTask', opts).then(result => result),
  deleteTask: (opts) => ipcRenderer.invoke('deleteTask', opts).then(result => result),
  getTasks: (projectName: string) => ipcRenderer.invoke('getTasks', projectName).then(result => result),
  addRunningTask: (opts) => ipcRenderer.invoke('addRunningTask', opts).then(result => result),
  getRunningTasks: () => ipcRenderer.invoke('getRunningTasks').then(result => result),
  getRunningTask: (opts) => ipcRenderer.invoke('getRunningTask', opts).then(result => result),
  startRunningTask: (opts) => ipcRenderer.invoke('startRunningTask', opts).then(result => result),
  stopRunningTask: (opts) => ipcRenderer.invoke('stopRunningTask', opts).then(result => result),
  toggleRunningTask: (opts) => ipcRenderer.invoke('toggleRunningTask', opts).then(result => result),
})
