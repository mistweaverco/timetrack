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

type MainProcessRunningTaskMapped = {
  name: string,
  projectName: string,
  date: string,
  seconds: number,
  time: string,
  isRunning: boolean,
}

type MainProcessManageRunningTasksOpts = {
  projectName: string,
  name: string,
  date: string,
}

type MainProccessAddRunningTaskOpts = {
  name: string,
  projectName: string,
  date: string,
  seconds: number,
}

type DBEditProjectOpts = {
  name: string,
  oldname: string,
}

type DBAddTaskDefinitionOpts = {
  name: string,
  projectName: string,
}

type DBEditTaskDefinitionOpts = {
  name: string,
  oldname: string,
  projectName: string,
}

type DBDeleteTaskDefinitionOpts = {
  name: string,
  projectName: string,
}

type DBAddTaskOpts = {
  name: string,
  description: string,
  projectName: string,
}

type DBEditTaskOpts = {
  name: string,
  description: string,
  seconds: number,
  oldname: string,
  date: string,
  projectName: string,
}

type DBDeleteTaskOpts = {
  name: string,
  date: string,
  projectName: string,
}

type MainProcessIPCHandle = {
  id: string,
  cb: any, // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface Window {
  versions: {
    node: string;
    chrome: string;
    electron: string;
  }
  electron: {
    addProject: (name: string) => Promise<{success: boolean}>;
    editProject: (opts: { name: string, oldname: string }) => Promise<{success: boolean}>;
    deleteProject: (name: string) => Promise<{success: boolean}>;
    getProjects: () => Promise<DBProject[]>;
    addTaskDefinition: (opts: { projectName: string, name: string, command: string }) => Promise<{success: boolean}>;
    editTaskDefinition: (opts: { projectName: string, name: string, newName: string, command: string }) => Promise<{success: boolean}>;
    deleteTaskDefinition: (opts: { projectName: string, name: string }) => Promise<{success: boolean}>;
    getTaskDefinitions: (projectName: string) => Promise<DBTaskDefinition[]>;
    addTask: (opts: { projectName: string, name: string, definitionName: string, args: string[] }) => Promise<{success: boolean}>;
    editTask: (opts: { projectName: string, name: string, newName: string, definitionName: string, args: string[] }) => Promise<{success: boolean}>;
    deleteTask: (opts: { projectName: string, name: string }) => Promise<{success: boolean}>;
    getTasks: (projectName: string) => Promise<DBTask[]>;
    addRunningTask: (opts: { projectName: string, taskName: string }) => Promise<{success: boolean}>;
    getRunningTasks: () => Promise<MainProcessRunningTaskMapped[]>;
    getRunningTask: (opts: { projectName: string, taskName: string }) => Promise<MainProcessRunningTaskMapped>;
    startRunningTask: (opts: { projectName: string, taskName: string }) => Promise<{success: boolean}>;
    stopRunningTask: (opts: { projectName: string, taskName: string }) => Promise<{success: boolean}>;
    toggleRunningTask: (opts: { projectName: string, taskName: string }) => Promise<{success: boolean}>;
  }
}
