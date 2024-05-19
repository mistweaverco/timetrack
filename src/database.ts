import { readFile, readdir } from 'node:fs/promises'
import logger from 'node-color-log'
import path from 'node:path'
import { Database as Sqlite3Database } from 'sqlite3'
import { open, Database } from 'sqlite'
import { getUserDataPath, getUserConfig } from './lib/ConfigFile'

const dbMigrate = async (db: Database, version: string | null) => {
  // read directory and get all migration files in order start from 'version' (excluded)
  // and run all migration files in order
  const migrationFiles = path.join(__dirname, 'db-migrations')
  const files = await readdir(migrationFiles)
  const migrationFilesToRun = files
    .filter(f => {
      const file = f.replace('.sql', '')
      if (version === null || version === '') {
        return true
      }
      return file > version
    })
    .sort()
  if (migrationFilesToRun.length === 0) {
    logger.info('🗃️ No migrations to run')
    return
  }
  migrationFilesToRun.forEach(async file => {
    logger.warn('🗃️ Running migration', file)
    const sql = await readFile(path.join(migrationFiles, file), 'utf8')
    await db.exec(sql)
    await db.run('UPDATE db_version SET version = ?', file.replace('.sql', ''))
  })
}

const initDBMigration = async (db: Database) => {
  const versionTableExits = await db.all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    'db_version',
  )
  if (versionTableExits.length === 0) {
    await db.exec('CREATE TABLE db_version (version TEXT)')
    await db.run('INSERT INTO db_version (version) VALUES ("")')
    await dbMigrate(db, null)
  } else {
    const version = await db.get('SELECT version FROM db_version')
    await dbMigrate(db, version.version)
  }
}

const initDB = async (): Promise<Database> => {
  const userConfig = await getUserConfig()
  const userDataPath = await getUserDataPath()
  let sqlFilePath = path.join(userDataPath, 'timetrack.db')
  if (userConfig && userConfig.database_file_path) {
    sqlFilePath = userConfig.database_file_path
    console.warn('🗃️ Using custom database file path', sqlFilePath)
  }
  let db: Database
  try {
    db = await open({ filename: sqlFilePath, driver: Sqlite3Database })
  } catch (err) {
    logger.error('📢 Error opening database file:', sqlFilePath)
    electron.app.quit()
  }
  const atable = await db.all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    'projects',
  )
  if (atable.length === 0) {
    const sql = await readFile(path.join(__dirname, 'db.sql'), 'utf8')
    await db.exec(sql)
  } else {
    // files exists, and projects table exist check if migration is needed
    await initDBMigration(db)
  }
  return db
}

type Task = {
  name: string
  project_name: string
  date: string
  seconds: number
}

const getSearchResult = async (
  db: Database,
  q: SearchQuery,
): Promise<SearchQueryResult> => {
  const active_state = q.active_state
    .replace('all', 'active = 1 OR active = 0')
    .replace('active', 'active = 1')
    .replace('inactive', 'active = 0')
  const search_in = q.search_in
  const project_name = q.task.project_name.replace(/\*/g, '%')
  const task_name = q.task.task_name.replace(/\*/g, '%')
  const task_description = q.task.task_description.replace(/\*/g, '%')
  const task_definition_name = q.task.task_definition_name.replace(/\*/g, '%')
  let dbResultProjects = []
  if (search_in.includes('projects')) {
    dbResultProjects = await db.all(
      `SELECT name FROM projects WHERE name LIKE ?`,
      project_name,
    )
  }
  let dbResultTaskDefinitions = []
  if (search_in.includes('task_definitions')) {
    dbResultTaskDefinitions = await db.all(
      `SELECT name, project_name FROM task_definitions WHERE name LIKE ? AND project_name LIKE ?`,
      task_definition_name,
      project_name,
    )
  }
  let dbResultTasks = []
  if (search_in.includes('tasks')) {
    dbResultTasks = await db.all(
      `SELECT name, project_name, date, description, seconds FROM tasks WHERE date BETWEEN ? AND ? AND name LIKE ? AND name LIKE ? AND description LIKE ? AND project_name LIKE ?`,
      q.from_date,
      q.to_date,
      task_name,
      task_definition_name,
      task_description,
      project_name,
    )
  }
  return {
    projects: dbResultProjects,
    task_definitions: dbResultTaskDefinitions,
    tasks: dbResultTasks,
  }
}

const getDataForPDFExport = async (
  db: Database,
  q: PDFQuery,
): Promise<DBProject[]> => {
  const inTaskClause = q.tasks.map(task => `'${task.name}'`).join(',')
  const res = await db.all(
    `SELECT * FROM tasks WHERE date BETWEEN ? AND ? AND name IN(${inTaskClause})`,
    q.from,
    q.to,
  )
  return res
}

const saveActiveTask = async (db: Database, task: Task) => {
  await db.run(
    'UPDATE tasks SET seconds = ? WHERE name = ? AND project_name = ? AND date = ?',
    task.seconds,
    task.name,
    task.project_name,
    task.date,
  )
}

const saveActiveTasks = async (db: Database, tasks: Task[]) => {
  tasks.forEach(async task => {
    await db.run(
      'UPDATE tasks SET seconds = ? WHERE name = ? AND project_name = ? AND date = ?',
      task.seconds,
      task.name,
      task.project_name,
      task.date,
    )
  })
}

const getProjects = async (db: Database): Promise<DBProject[]> => {
  const projects = await db.all('SELECT * FROM projects')
  return projects
}

const addProject = async (db: Database, name: string) => {
  await db.run('INSERT INTO projects (name) VALUES (?)', name)
  return { success: true }
}

const editProject = async (db: Database, opts: DBEditProjectOpts) => {
  await db.run(
    'UPDATE projects SET name = ? WHERE name = ?',
    opts.name,
    opts.oldname,
  )
  await db.run(
    'UPDATE tasks SET project_name = ? WHERE project_name = ?',
    opts.name,
    opts.oldname,
  )
  await db.run(
    'UPDATE task_definitions SET project_name = ? WHERE project_name = ?',
    opts.name,
    opts.oldname,
  )
  return { success: true }
}

const deleteProject = async (db: Database, name: string) => {
  await db.run('DELETE FROM projects WHERE name = ?', name)
  await db.run('DELETE FROM task_definitions WHERE project_name = ?', name)
  await db.run('DELETE FROM tasks WHERE project_name = ?', name)
  return { success: true }
}

const addTaskDefinition = async (
  db: Database,
  opts: DBAddTaskDefinitionOpts,
) => {
  await db.run(
    'INSERT INTO task_definitions (name, project_name) VALUES (?, ?)',
    opts.name,
    opts.project_name,
  )
  return { success: true }
}

const editTaskDefinition = async (
  db: Database,
  opts: DBEditTaskDefinitionOpts,
) => {
  await db.run(
    'UPDATE task_definitions SET name = ? WHERE name=? AND project_name = ?',
    opts.name,
    opts.oldname,
    opts.project_name,
  )
  await db.run(
    'UPDATE tasks SET name = ? WHERE name=? AND project_name = ?',
    opts.name,
    opts.oldname,
    opts.project_name,
  )
  return { success: true }
}

const deleteTaskDefinition = async (
  db: Database,
  opts: DBDeleteTaskDefinitionOpts,
) => {
  await db.run(
    'DELETE FROM task_definitions WHERE name = ? AND project_name = ?',
    opts.name,
    opts.project_name,
  )
  await db.run(
    'DELETE FROM tasks WHERE name = ? AND project_name = ?',
    opts.name,
    opts.project_name,
  )
  return { success: true }
}

const getTaskDefinitions = async (
  db: Database,
  project_name: string,
): Promise<DBTaskDefinition[]> => {
  const tasks = await db.all(
    'SELECT * FROM task_definitions WHERE project_name = ?',
    project_name,
  )
  return tasks
}

const getAllTaskDefinitions = async (
  db: Database,
): Promise<DBTaskDefinition[]> => {
  const res = await db.all('SELECT * FROM task_definitions')
  return res
}

const addTask = async (db: Database, opts: DBAddTaskOpts) => {
  await db.run(
    'INSERT INTO tasks (name, description, project_name, seconds) VALUES (?, ?, ?, ?)',
    opts.name,
    opts.description,
    opts.project_name,
    opts.seconds,
  )
  return { success: true }
}

const editTask = async (db: Database, opts: DBEditTaskOpts) => {
  await db.run(
    'UPDATE tasks SET name = ?, description = ?, seconds = ? WHERE name=? AND date=? AND project_name = ?',
    opts.name,
    opts.description,
    opts.seconds,
    opts.name,
    opts.date,
    opts.project_name,
  )
  return { success: true }
}

const deleteTask = async (db: Database, opts: DBDeleteTaskOpts) => {
  await db.run(
    'DELETE FROM tasks WHERE name = ? AND date = ? AND project_name = ?',
    opts.name,
    opts.date,
    opts.project_name,
  )
  return { success: true }
}

const getTasks = async (
  db: Database,
  project_name: string,
): Promise<DBTask[]> => {
  const tasks = await db.all(
    'SELECT * FROM tasks WHERE project_name = ?',
    project_name,
  )
  return tasks
}

const getTasksByNameAndProject = async (
  db: Database,
  opts: { name: string; project_name: string },
): Promise<DBTask[]> => {
  const tasks = await db.all(
    'SELECT * FROM tasks WHERE name = ? AND project_name = ?',
    opts.name,
    opts.project_name,
  )
  return tasks
}

const getTasksToday = async (
  db: Database,
  project_name: string,
): Promise<DBTask[]> => {
  const tasks = await db.all(
    'SELECT * FROM tasks WHERE project_name = ? AND date=DATE("now", "localtime")',
    project_name,
  )
  return tasks
}

export {
  initDB,
  addProject,
  editProject,
  deleteProject,
  getProjects,
  addTaskDefinition,
  editTaskDefinition,
  deleteTaskDefinition,
  getTaskDefinitions,
  getAllTaskDefinitions,
  addTask,
  editTask,
  deleteTask,
  getTasks,
  getTasksByNameAndProject,
  getTasksToday,
  saveActiveTasks,
  saveActiveTask,
  getDataForPDFExport,
  getSearchResult,
}
