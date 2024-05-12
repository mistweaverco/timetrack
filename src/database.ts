import { app } from 'electron'
import fs from 'fs'
import path from 'node:path'
import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
const userDataPath = app.getPath('userData')
const sqlFilePath = path.join(userDataPath, '..', 'timetrack', 'timetrack.db')

// make sure sqlFilePath exists
if (!fs.existsSync(sqlFilePath)) {
  fs.mkdirSync(path.dirname(sqlFilePath), { recursive: true })
}

const initDB = async (): Promise<Database> =>{
  const db = await open({ filename: sqlFilePath, driver: sqlite3.Database })
  const atable = await db.all('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?', 'projects')
  if (atable.length === 0) {
    const sql = fs.readFileSync(path.join(__dirname, 'db.sql'), 'utf8')
    await db.exec(sql)
  }
  return db
}

type Task = {
  name: string,
  projectName: string,
  date: string,
  seconds: number,
}

const saveRunningTasks = async (db: Database, tasks: Task[]) => {
  tasks.forEach(async (task) => {
    await db.run('UPDATE tasks SET seconds = ? WHERE name = ? AND project_name = ? AND date = ?', task.seconds, task.name, task.projectName, task.date);
  });
}

const getProjects = async (db: Database) => {
  const projects = await db.all('SELECT * FROM projects')
  return projects
}

const addProject = async (db: Database, name: string) => {
  await db.run('INSERT INTO projects (name) VALUES (?)', name)
  return { success: true }
}

type EditProjectOpts = {
  name: string,
  oldname: string,
}

const editProject = async (db: Database, opts: EditProjectOpts) => {
  await db.run('UPDATE projects SET name = ? WHERE name = ?', opts.name, opts.oldname)
  await db.run('UPDATE tasks SET project_name = ? WHERE project_name = ?', opts.name, opts.oldname)
  await db.run('UPDATE tasks_definitions SET project_name = ? WHERE project_name = ?', opts.name, opts.oldname)
  return { success: true }
}

const deleteProject = async (db: Database, name: string) => {
  await db.run('DELETE FROM projects WHERE name = ?', name)
  await db.run('DELETE FROM task_definitions WHERE project_name = ?', name)
  await db.run('DELETE FROM tasks WHERE project_name = ?', name)
  return { success: true }
}

type AddTaskDefinitionOpts = {
  name: string,
  projectName: string,
}

const addTaskDefinition = async (db: Database, opts: AddTaskDefinitionOpts) => {
  await db.run('INSERT INTO task_definitions (name, project_name) VALUES (?, ?)', opts.name, opts.projectName)
  return { success: true }
}

type EditTaskDefinitionOpts = {
  name: string,
  oldname: string,
  projectName: string,
}

const editTaskDefinition = async (db: Database, opts: EditTaskDefinitionOpts) => {
  await db.run('UPDATE task_definitions SET name = ? WHERE name=? AND project_name = ?', opts.name, opts.oldname, opts.projectName)
  return { success: true }
}

type DeleteTaskDefinitionOpts = {
  name: string,
  projectName: string,
}

const deleteTaskDefinition = async (db: Database, opts: DeleteTaskDefinitionOpts) => {
  await db.run('DELETE FROM task_definitions WHERE name = ? AND project_name = ?', opts.name, opts.projectName)
  return { success: true }
}

const getTaskDefinitions = async (db: Database, projectName: string) => {
  const tasks = await db.all('SELECT * FROM task_definitions WHERE project_name = ?', projectName)
  return tasks
}

type AddTaskOpts = {
  name: string,
  description: string,
  projectName: string,
}

const addTask = async (db: Database, opts: AddTaskOpts) => {
  await db.run('INSERT INTO tasks (name, description, project_name) VALUES (?, ?, ?)', opts.name, opts.description, opts.projectName)
  return { success: true }
}

type EditTaskOpts = {
  name: string,
  description: string,
  seconds: number,
  oldname: string,
  date: string,
  projectName: string,
}

const editTask = async (db: Database, opts: EditTaskOpts) => {
  await db.run('UPDATE tasks SET name = ?, description = ?, seconds = ? WHERE name=? AND date=? AND project_name = ?', opts.name, opts.description, opts.seconds, opts.oldname, opts.date, opts.projectName)
  return { success: true }
}

type DeleteTaskOpts = {
  name: string,
  date: string,
  projectName: string,
}

const deleteTask = async (db: Database, opts: DeleteTaskOpts) => {
  const res = await db.run('DELETE FROM tasks WHERE name = ? AND date = ? AND project_name = ?', opts.name, opts.date, opts.projectName)
  console.log({res, opts})
  return { success: true }
}

const getTasks = async (db: Database, projectName: string) => {
  const tasks = await db.all('SELECT * FROM tasks WHERE project_name = ?', projectName)
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
  addTask,
  editTask,
  deleteTask,
  getTasks,
  saveRunningTasks,
}

