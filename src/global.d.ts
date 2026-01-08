type ActiveTask = {
  name: string
  project_name: string
  description: string
  date: string
  seconds: number
  tick?: NodeJS.Timeout | null
  isActive?: boolean
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
  project_name: string
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
  name: string
  status?: string
}

type DBProject = {
  name: string
  company_name: string
  status?: string
}

type DBTaskDefinition = {
  name: string
  project_name: string
  status?: string
}

type DBTask = {
  name: string
  project_name: string
  description: string
  seconds: number
  date: string
  status?: string
}

type MainProcessActiveTaskMapped = {
  name: string
  project_name: string
  date: string
  seconds: number
  time: string
  isActive: boolean
}

type MainProcessManageActiveTasksOpts = {
  project_name: string
  name: string
  date: string
  seconds?: number
}

type MainProccessAddActiveTaskOpts = {
  name: string
  project_name: string
  date: string
  seconds: number
}

type DBEditCompanyOpts = {
  name: string
  oldname: string
  status?: string
}

type DBEditProjectOpts = {
  name: string
  oldname: string
  company_name: string
  status?: string
}

type DBAddTaskDefinitionOpts = {
  name: string
  project_name: string
}

type DBEditTaskDefinitionOpts = {
  name: string
  oldname: string
  project_name: string
  status?: string
}

type DBDeleteTaskDefinitionOpts = {
  name: string
  project_name: string
}

type DBAddTaskOpts = {
  name: string
  description: string
  project_name: string
  seconds: number
}

type DBEditTaskOpts = {
  name: string
  description: string
  seconds: number
  date: string
  old_date: string
  project_name: string
  status?: string
}

type DBDeleteTaskOpts = {
  name: string
  date: string
  project_name: string
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
    addCompany: (name: string) => Promise<{ success: boolean }>
    editCompany: (opts: {
      name: string
      oldname: string
      status?: string
    }) => Promise<{ success: boolean }>
    deleteCompany: (name: string) => Promise<{ success: boolean }>
    addProject: (
      name: string,
      companyName: string,
    ) => Promise<{ success: boolean }>
    editProject: (opts: {
      name: string
      oldname: string
      company_name: string
      status?: string
    }) => Promise<{ success: boolean }>
    editCompany: (opts: {
      name: string
      oldname: string
      status?: string
    }) => Promise<{ success: boolean }>
    deleteProject: (name: string) => Promise<{ success: boolean }>
    getProjects: () => Promise<DBProject[]>
    addTaskDefinition: (opts: {
      project_name: string
      name: string
    }) => Promise<{ success: boolean }>
    editTaskDefinition: (opts: {
      project_name: string
      name: string
      oldname: string
      status?: string
    }) => Promise<{ success: boolean }>
    deleteTaskDefinition: (opts: {
      project_name: string
      name: string
    }) => Promise<{ success: boolean }>
    getTaskDefinitions: (project_name: string) => Promise<DBTaskDefinition[]>
    addTask: (opts: {
      project_name: string
      name: string
      description: string
      seconds: number
    }) => Promise<{ success: boolean }>
    editTask: (opts: {
      project_name: string
      name: string
      description: string
      seconds: number
      date: string
      old_date: string
      status?: string
    }) => Promise<DBTask & { success: boolean }>
    deleteTask: (opts: {
      project_name: string
      name: string
      date: string
    }) => Promise<{ success: boolean }>
    getTasks: (project_name: string) => Promise<DBTask[]>
    getTasksByNameAndProject: (opts: {
      name: string
      project_name: string
    }) => Promise<DBTask[]>
    getActiveTasks: () => Promise<ActiveTask[]>
    startActiveTask: (
      opts: ActiveTask,
    ) => Promise<ActiveTask & { success: boolean }>
    pauseActiveTask: (opts: ActiveTask) => Promise<{ success: boolean }>
    stopActiveTask: (opts: {
      project_name: string
      name: string
      date: string
    }) => Promise<(ActiveTask & { success: true }) | { success: false }>
    getDataForPDFExport: (opts: PDFQuery) => Promise<PDFQueryResult[]>
    showFileSaveDialog: () => Promise<void>
    getPDFExport: (filepath: string) => Promise<void>
    getSearchResult: (query: SearchQuery) => Promise<SearchQueryResult>
  }
}
