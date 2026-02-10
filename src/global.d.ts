type ActiveTask = {
  taskId: string
  description: string
  date: string
  seconds: number
  tick?: NodeJS.Timeout | null
  isActive?: boolean
  name: string
  projectName: string
  companyName: string
}

type PDFTotalObject = {
  [key: string]: {
    [key: string]: number
  }
}

type PDFQueryResult = {
  date: string
  description: string
  name: string
  projectName: string
  companyName: string
  seconds: number
}

type PDFQueryTask = {
  project_name: string
  name: string
}

type PDFQuery = {
  from: string
  to: string
  tasks: PDFQueryTask[]
}

type SearchQueryTask = {
  project_name: string
  task_name: string
  task_definition_name: string
  task_description: string
  company_name: string
}

type SearchQuery = {
  search_in: string[]
  active_state: string
  from_date: string
  task: SearchQueryTask
  to_date: string
}

type SearchQueryResultTask = DBTask & {
  descriptionHTML?: string
}

type SearchQueryResult = {
  companies: DBCompany[]
  projects: DBProject[]
  task_definitions: DBTaskDefinition[]
  tasks: SearchQueryResultTask[]
}

type DBCompany = {
  id: string
  name: string
  status?: string
  statusId?: number
}

type DBProject = {
  id: string
  name: string
  companyId: string
  companyName: string
  company: DBCompany
  status?: string
  statusId?: number
}

type DBTaskDefinition = {
  id: string
  name: string
  projectId: string
  projectName: string
  status?: string
  statusId?: number
}

type DBTask = {
  id: string
  name: string
  taskDefinitionId: string
  projectName: string
  companyName: string
  description: string
  seconds: number
  date: string
  status?: string
}

type MainProcessActiveTaskMapped = {
  taskId: string
  date: string
  seconds: number
  time: string
  isActive: boolean
}

type MainProcessManageActiveTasksOpts = {
  taskId: string
  date: string
  seconds?: number
}

type MainProccessAddActiveTaskOpts = {
  taskId: string
  date: string
  seconds: number
}

type DBEditCompanyOpts = {
  id: string
  name: string
  status?: string
}

type DBEditProjectOpts = {
  id: string
  name: string
  companyId: string
  status?: string
}

type DBAddTaskDefinitionOpts = {
  name: string
  projectId: string
}

type DBEditTaskDefinitionOpts = {
  id: string
  name: string
  status?: string
}

type DBDeleteTaskDefinitionOpts = {
  id: string
}

type DBAddTaskOpts = {
  taskDefinitionId: string
  description: string
  seconds: number
}

type DBEditTaskOpts = {
  id: string
  taskDefinitionId: string
  description: string
  seconds: number
  date: string
  oldDate: string
  status?: string
}

type DBDeleteTaskOpts = {
  id: string
}

type MainProcessIPCHandle = {
  id: string
  cb: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string
declare const electron: any // eslint-disable-line @typescript-eslint/no-explicit-any

declare module '*?asset' {
  const content: string
  export default content
}

interface Window {
  versions: {
    node: string
    chrome: string
    electron: string
  }
  electron: {
    on: (channel: string, callback: ElectronOnCallback) => void
    off: (channel: string) => void
    getCompanyByName: (name: string) => Promise<DBCompany | null>
    getCompanies: (statusName?: string) => Promise<DBCompany[]>
    addCompany: (
      name: string,
    ) => Promise<{ success: boolean; company: DBCompany }>
    mergeCompanies: (
      sourceCompanyId: string,
      targetCompanyId: string,
    ) => Promise<{ success: boolean }>
    editCompany: (opts: DBEditCompanyOpts) => Promise<{ success: boolean }>
    deleteCompany: (id: string) => Promise<{ success: boolean }>
    addProject: (
      name: string,
      companyId: string,
    ) => Promise<{ success: boolean; project: DBProject }>
    mergeProjects: (
      sourceProjectId: string,
      targetProjectId: string,
    ) => Promise<{ success: boolean }>
    editProject: (opts: DBEditProjectOpts) => Promise<{ success: boolean }>
    deleteProject: (id: string) => Promise<{ success: boolean }>
    getProjectByName: (
      name: string,
      companyId: string,
    ) => Promise<DBProject | null>
    getProjects: (
      companyId?: string,
      statusName: string,
    ) => Promise<DBProject[]>
    addTaskDefinition: (opts: DBAddTaskDefinitionOpts) => Promise<{
      success: boolean
      taskDefinition: DBTaskDefinition
    }>
    mergeTaskDefinitions: (
      sourceTaskDefinitionId: string,
      targetTaskDefinitionId: string,
    ) => Promise<{ success: boolean }>
    editTaskDefinition: (opts: DBEditTaskDefinitionOpts) => Promise<{
      success: boolean
    }>
    deleteTaskDefinition: (opts: DBDeleteTaskDefinitionOpts) => Promise<{
      success: boolean
    }>
    getTasksToday: (projectId: string) => Promise<DBTask[]>
    getTaskDefinitionByName: (
      name: string,
      projectId: string,
    ) => Promise<DBTaskDefinition | null>
    getTaskDefinitions: (projectId: string) => Promise<DBTaskDefinition[]>
    getTaskById: (id: string) => Promise<DBTask | null>
    getTaskByTaskDefinitionAndDate: (
      id: string,
      date: string,
    ) => Promise<DBTask | null>
    addTask: (opts: DBAddTaskOpts) => Promise<{ success: boolean; id: string }>
    editTask: (opts: DBEditTaskOpts) => Promise<DBTask & { success: boolean }>
    deleteTask: (opts: DBDeleteTaskOpts) => Promise<{ success: boolean }>
    getTasks: (projectId: string) => Promise<DBTask[]>
    getTasksByNameAndProject: (opts: {
      taskDefinitionId: string
    }) => Promise<DBTask[]>
    getActiveTasks: () => Promise<ActiveTask[]>
    startActiveTask: (id: string) => Promise<ActiveTask & { success: boolean }>
    pauseActiveTask: (
      id: string,
    ) => Promise<(ActiveTask & { success: true }) | { success: false }>
    stopActiveTask: (
      id: string,
    ) => Promise<(ActiveTask & { success: true }) | { success: false }>
    getDataForPDFExport: (opts: PDFQuery) => Promise<PDFQueryResult[]>
    showFileSaveDialog: (options?: {
      defaultPath?: string
      filters?: Electron.FileFilter[]
    }) => Promise<Electron.SaveDialogReturnValue>
    saveFile: (
      filePath: string,
      content: string,
    ) => Promise<{ success: boolean }>
    getPDFExport: (filepath: string) => Promise<void>
    getSearchResult: (query: SearchQuery) => Promise<SearchQueryResult>
  }
}
