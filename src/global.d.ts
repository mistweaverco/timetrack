type ActiveTask = {
  name: string,
  project_name: string,
  description: string,
  date: string,
  seconds: number,
  tick?: NodeJS.Timeout | null,
  isActive?: boolean,
}

type PDFTotalObject = {
 [key: string]: {
    [key: string]: number
  }
}

type PDFQueryResult = {
  date: string,
  description: string,
  name: string,
  project_name: string,
  seconds: number,
}

type PDFQueryTask = {
  project_name: string,
  name: string,
}

type PDFQuery = {
  from: string,
  to: string,
  tasks: PDFQueryTask[],
}

type SearchQueryTask = {
  project_name: string,
  task_name: string,
  task_definition_name: string,
  task_description: string,
}

type SearchQuery = {
  active_state: string,
  from_date: string,
  task: SearchQueryTask,
  to_date: string,
}

type SearchQueryResult = {
  projects: DBProject[],
  task_definitions: DBTaskDefinition[],
  tasks: DBTask[],
}

type DBProject = {
  name: string,
}

type DBTaskDefinition = {
  name: string,
  project_name: string,
}

type DBTask = {
  name: string,
  project_name: string,
  description: string,
  seconds: number,
  date: string,
}

type MainProcessActiveTaskMapped = {
  name: string,
  project_name: string,
  date: string,
  seconds: number,
  time: string,
  isActive: boolean,
}

type MainProcessManageActiveTasksOpts = {
  project_name: string,
  name: string,
  date: string,
  seconds?: number,
}

type MainProccessAddActiveTaskOpts = {
  name: string,
  project_name: string,
  date: string,
  seconds: number,
}

type DBEditProjectOpts = {
  name: string,
  oldname: string,
}

type DBAddTaskDefinitionOpts = {
  name: string,
  project_name: string,
}

type DBEditTaskDefinitionOpts = {
  name: string,
  oldname: string,
  project_name: string,
}

type DBDeleteTaskDefinitionOpts = {
  name: string,
  project_name: string,
}

type DBAddTaskOpts = {
  name: string,
  description: string,
  project_name: string,
  seconds: number,
}

type DBEditTaskOpts = {
  name: string,
  description: string,
  seconds: number,
  date: string,
  project_name: string,
}

type DBDeleteTaskOpts = {
  name: string,
  date: string,
  project_name: string,
}

type MainProcessIPCHandle = {
  id: string,
  cb: any, // eslint-disable-line @typescript-eslint/no-explicit-any
}

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
declare const electron: any; // eslint-disable-line @typescript-eslint/no-explicit-any

interface Window {
  versions: {
    node: string;
    chrome: string;
    electron: string;
  }
  electron: {
    on: (channel: string, callback: (data: any) => void) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    addProject: (name: string) => Promise<{success: boolean}>;
    editProject: (opts: { name: string, oldname: string }) => Promise<{success: boolean}>;
    deleteProject: (name: string) => Promise<{success: boolean}>;
    getProjects: () => Promise<DBProject[]>;
    addTaskDefinition: (opts: { project_name: string, name: string }) => Promise<{success: boolean}>;
    editTaskDefinition: (opts: { project_name: string, name: string, oldname: string }) => Promise<{success: boolean}>;
    deleteTaskDefinition: (opts: { project_name: string, name: string }) => Promise<{success: boolean}>;
    getTaskDefinitions: (project_name: string) => Promise<DBTaskDefinition[]>;
    addTask: (opts: { project_name: string, name: string, description: string, seconds: number }) => Promise<{success: boolean}>;
    editTask: (opts: { project_name: string, name: string, description: string, seconds: number, date: string }) => Promise<{success: boolean}>;
    deleteTask: (opts: { project_name: string, name: string, date: string }) => Promise<{success: boolean}>;
    getTasks: (project_name: string) => Promise<DBTask[]>;
    getActiveTasks: () => Promise<ActiveTask[]>;
    startActiveTask: (opts: { project_name: string, name: string, date: string; seconds: number }) => Promise<{success: boolean}>;
    stopActiveTask: (opts: { project_name: string, name: string, date: string }) => Promise<{success: boolean}>;
    getDataForPDFExport: (opts: PDFQuery) => Promise<PDFQueryResult[]>;
    showFileSaveDialog: () => Promise<void>;
    getPDFExport: (filepath: string) => Promise<void>;
    getSearchResult: (query: SearchQuery) => Promise<SearchQueryResult>;
  }
}
