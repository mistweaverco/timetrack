import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { CountUp } from './countup';
import {
  initDB,
  getProjects,
  addProject,
  editProject,
  deleteProject,
  addTaskDefinition,
  editTaskDefinition,
  deleteTaskDefinition,
  getTaskDefinitions,
  addTask,
  editTask,
  deleteTask,
  getTasks,
  saveRunningTasks,
} from './database'

let DB;

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 960,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open the DevTools.
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  win.setMenuBarVisibility(false)
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


app.commandLine.appendSwitch('disable-gpu-vsync')


const runningTasks = []

const getRunningTasks = async () => {
  const tasks = runningTasks.map(t => {
    return {
      name: t.name,
      projectName: t.projectName,
      date: t.date,
      seconds: t.seconds,
      time: t.getTime(),
      isRunning: t.isRunning(),
    }
  })
  return tasks
}

const periodicSaveRunningTasks = async () => {
  const tasks = await getRunningTasks();
  saveRunningTasks(DB, tasks);
}

const startRunningTask = async (opts) => {
  const task = await getRunningTask(opts);
  if (!task) {
    console.error('task not found', opts);
  }
  task.start();
  return {
    success: true,
    projectName: task.projectName,
    name: task.name,
    date: task.date,
    seconds: task.seconds,
    datestring: task.getTime(),
    isRunning: task.isRunning(),
  };
}

const stopRunningTask = async (opts) => {
  const task = await getRunningTask(opts);
  if (!task) {
    console.error('task not found', opts);
  }
  task.stop();
  return {
    success: true,
    projectName: task.projectName,
    name: task.name,
    date: task.date,
    seconds: task.seconds,
    datestring: task.getTime(),
    isRunning: task.isRunning(),
  };
}

const toggleRunningTask = async (opts) => {
  const task = await getRunningTask(opts);
  if (!task) {
    console.error('task not found', opts);
  }
  if (task.isRunning) {
    task.stop();
  } else {
    task.start();
  }
  return {
    success: true,
    projectName: task.projectName,
    name: task.name,
    date: task.date,
    seconds: task.seconds,
    datestring: task.getTime(),
    isRunning: task.isRunning(),
  };
}

const addRunningTask = async (task) => {
  const countup = new CountUp(task.name, task.projectName, task.date, task.seconds)
  countup.start()
  runningTasks.push(countup)
  return { success: true }
}

const getRunningTask = async (opts) => {
  const task = runningTasks.find(t => t.name === opts.name && t.projectName === opts.projectName && t.date === opts.date)
  if (task) {
    return task
  }
  return null;
}

const setupIPCHandles = async () => {
  const ipcHandles = [
    {
      id: 'getProjects',
      cb: async () => {
        const json = await getProjects(DB)
        return json
      }
    },
    {
      id: 'addProject',
      cb: async (_, name) => {
        const json = await addProject(DB, name)
        return json
      }
    },
    {
      id: 'editProject',
      cb: async (_, name) => {
        const json = await editProject(DB, name)
        return json
      }
    },
    {
      id: 'deleteProject',
      cb: async (_, name) => {
        const json = await deleteProject(DB, name)
        return json
      }
    },
    {
      id: 'addTaskDefinition',
      cb: async (_, opts) => {
        const json = await addTaskDefinition(DB, opts)
        return json
      }
    },
    {
      id: 'editTaskDefinition',
      cb: async (_, opts) => {
        const json = await editTaskDefinition(DB, opts)
        return json
      }
    },
    {
      id: 'deleteTaskDefinition',
      cb: async (_, opts) => {
        const json = await deleteTaskDefinition(DB, opts)
        return json
      }
    },
    {
      id: 'getTaskDefinitions',
      cb: async (_, name) => {
        const tasks = await getTaskDefinitions(DB, name)
        return tasks
      }
    },
    {
      id: 'addTask',
      cb: async (_, opts) => {
        const json = await addTask(DB, opts)
        return json
      }
    },
    {
      id: 'editTask',
      cb: async (_, opts) => {
        const json = await editTask(DB, opts)
        return json
      }
    },
    {
      id: 'deleteTask',
      cb: async (_, opts) => {
        const json = await deleteTask(DB, opts)
        return json
      }
    },
    {
      id: 'getTasks',
      cb: async (_, name) => {
        const json = await getTasks(DB, name)
        return json
      }
    },
    {
      id: 'addRunningTask',
      cb: async (_, opts) => {
        const json = await addRunningTask(opts)
        return json
      }
    },
    {
      id: 'getRunningTasks',
      cb: async () => {
        const json = await getRunningTasks()
        return json
      }
    },
    {
      id: 'getRunningTask',
      cb: async (_, opts) => {
        const json = await getRunningTask(opts)
        return json
      }
    },
    {
      id: 'startRunningTask',
      cb: async (_, opts) => {
        const json = await startRunningTask(opts)
        return json
      }
    },
    {
      id: 'stopRunningTask',
      cb: async (_, opts) => {
        const json = await stopRunningTask(opts)
        return json
      }
    },
    {
      id: 'toggleRunningTask',
      cb: async (_, opts) => {
        const json = await toggleRunningTask(opts)
        return json
      }
    },
  ]
  ipcHandles.forEach(async(h) => {
    ipcMain.handle(h.id, h.cb);
  })
}

const onWhenReady = async () => {
  DB = await initDB()

  await setupIPCHandles()

  setInterval(async() => {
    await periodicSaveRunningTasks();
  }, 30000)

  createWindow()
}

app.whenReady().then(onWhenReady)

const onWindowAllClosed = async () => {
  await periodicSaveRunningTasks()
  DB.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
}

app.on('window-all-closed', onWindowAllClosed)

