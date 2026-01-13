type ActiveTask = {
  taskId: string
  description: string
  date: string
  seconds: number
  tick?: NodeJS.Timeout | null
  isActive?: boolean
  // Display fields (populated from database)
  name?: string
  projectName?: string
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

type SearchQueryResult = {
  companies: DBCompany[]
  projects: DBProject[]
  task_definitions: DBTaskDefinition[]
  tasks: DBTask[]
}

type DBCompany = {
  id: string
  name: string
  status?: string
}

type DBProject = {
  id: string
  name: string
  companyId: string
  companyName: string
  status?: string
}

type DBTaskDefinition = {
  id: string
  name: string
  projectId: string
  projectName: string
  status?: string
}

type DBTask = {
  id: string
  name: string
  taskDefinitionId: string
  projectName: string
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
    getCompanies: () => Promise<DBCompany[]>
    addCompany: (name: string) => Promise<{ success: boolean; id: string }>
    editCompany: (opts: DBEditCompanyOpts) => Promise<{ success: boolean }>
    deleteCompany: (id: string) => Promise<{ success: boolean }>
    addProject: (
      name: string,
      companyId: string,
    ) => Promise<{ success: boolean; id: string }>
    editProject: (opts: DBEditProjectOpts) => Promise<{ success: boolean }>
    deleteProject: (id: string) => Promise<{ success: boolean }>
    getProjects: (companyId?: string) => Promise<DBProject[]>
    addTaskDefinition: (opts: DBAddTaskDefinitionOpts) => Promise<{
      success: boolean
      id: string
    }>
    editTaskDefinition: (opts: DBEditTaskDefinitionOpts) => Promise<{
      success: boolean
    }>
    deleteTaskDefinition: (opts: DBDeleteTaskDefinitionOpts) => Promise<{
      success: boolean
    }>
    getTasksToday: (projectId: string) => Promise<DBTask[]>
    getTaskDefinitions: (projectId: string) => Promise<DBTaskDefinition[]>
    addTask: (opts: DBAddTaskOpts) => Promise<{ success: boolean; id: string }>
    editTask: (opts: DBEditTaskOpts) => Promise<DBTask & { success: boolean }>
    deleteTask: (opts: DBDeleteTaskOpts) => Promise<{ success: boolean }>
    getTasks: (projectId: string) => Promise<DBTask[]>
    getTasksByNameAndProject: (opts: {
      taskDefinitionId: string
    }) => Promise<DBTask[]>
    getActiveTasks: () => Promise<ActiveTask[]>
    startActiveTask: (
      opts: ActiveTask,
    ) => Promise<ActiveTask & { success: boolean }>
    pauseActiveTask: (
      opts: ActiveTask,
    ) => Promise<(ActiveTask & { success: true }) | { success: false }>
    stopActiveTask: (
      opts: ActiveTask,
    ) => Promise<(ActiveTask & { success: true }) | { success: false }>
    getDataForPDFExport: (opts: PDFQuery) => Promise<PDFQueryResult[]>
    showFileSaveDialog: () => Promise<void>
    getPDFExport: (filepath: string) => Promise<void>
    getSearchResult: (query: SearchQuery) => Promise<SearchQueryResult>
  }
}
