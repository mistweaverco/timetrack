import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import logger from 'node-color-log'
import fs from 'fs'
import path from 'path'
import { getDBFilePath } from './lib/ConfigFile'
import { status, company, project, taskDefinition, task } from './db/schema'
import { eq, and, gte, lt, like, sql, inArray } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

let db: ReturnType<typeof drizzle> | null = null

type Task = {
  taskId: string
  date: string
  seconds: number
}

export const getDatabase = async () => {
  if (!db) {
    await initDB()
  }
  return db!
}

// Helper function to get or create status
const getOrCreateStatus = async (
  db: ReturnType<typeof drizzle>,
  statusName: string,
): Promise<number> => {
  const existingStatus = await db
    .select()
    .from(status)
    .where(eq(status.name, statusName))
    .limit(1)

  if (existingStatus.length > 0) {
    return existingStatus[0].id
  }

  const result = await db
    .insert(status)
    .values({ name: statusName })
    .returning({ id: status.id })

  return result[0].id
}

const initDB = async () => {
  const sqlFilePath = await getDBFilePath()

  logger.info('🗃️ Initializing database with Drizzle...')

  // Create SQLite database connection
  const sqlite = new Database(sqlFilePath)

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON')

  // Create Drizzle instance
  db = drizzle(sqlite)

  // Try to run migrations programmatically, but fall back to creating tables if migrations don't exist
  try {
    const migrationsPath = path.join(process.cwd(), 'drizzle')

    // Check if migrations folder exists
    if (fs.existsSync(migrationsPath)) {
      logger.info('🗃️ Running database migrations...')
      migrate(db, { migrationsFolder: migrationsPath })
      logger.info('🗃️ Database migrations completed')
    } else {
      logger.info('🗃️ No migrations folder found, creating tables directly...')
      createTablesIfNotExist(db, sqlite)
    }
  } catch (migrateError) {
    logger.warn('⚠️ Migration error, creating tables directly:', migrateError)
    // If migrations fail, try to create tables manually
    try {
      createTablesIfNotExist(db, sqlite)
    } catch (createError) {
      logger.error('📢 Error creating tables:', createError)
      throw createError
    }
  }

  try {
    // Initialize default statuses if they don't exist
    await getOrCreateStatus(db, 'active')
    await getOrCreateStatus(db, 'inactive')
    logger.info('🗃️ Default statuses initialized')
  } catch (statusError) {
    logger.warn(
      '⚠️ Error initializing default statuses (they may already exist):',
      statusError,
    )
    // Don't throw - statuses might already exist from a previous run
  }

  logger.info('🗃️ Database connected successfully')
  return db
}

// Fallback function to create tables if migrations don't work
const createTablesIfNotExist = (
  db: ReturnType<typeof drizzle>,
  sqlite: Database.Database,
) => {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS Status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS Company (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      statusId INTEGER NOT NULL REFERENCES Status(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS Project (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      companyId INTEGER NOT NULL REFERENCES Company(id) ON DELETE CASCADE,
      statusId INTEGER NOT NULL REFERENCES Status(id) ON DELETE RESTRICT,
      UNIQUE(name, companyId)
    );

    CREATE TABLE IF NOT EXISTS TaskDefinition (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      projectId INTEGER NOT NULL REFERENCES Project(id) ON DELETE CASCADE,
      statusId INTEGER NOT NULL REFERENCES Status(id) ON DELETE RESTRICT,
      UNIQUE(name, projectId)
    );

    CREATE TABLE IF NOT EXISTS Task (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taskDefinitionId INTEGER NOT NULL REFERENCES TaskDefinition(id) ON DELETE CASCADE,
      description TEXT,
      date INTEGER NOT NULL,
      seconds INTEGER NOT NULL DEFAULT 0,
      statusId INTEGER NOT NULL REFERENCES Status(id) ON DELETE RESTRICT,
      UNIQUE(taskDefinitionId, date)
    );

    CREATE INDEX IF NOT EXISTS tasks_task_def_date_IDX ON Task(taskDefinitionId, date);
  `)
}

const getTaskByTaskDefinitionAndDate = async (
  db: ReturnType<typeof drizzle>,
  taskDefinitionId: string,
  date: string,
): Promise<DBTask | null> => {
  const dateParts = date.split('-')
  const targetDate = new Date(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2]),
    0,
    0,
    0,
    0,
  )

  const result = await db
    .select({
      id: task.id,
      taskDefinitionId: task.taskDefinitionId,
      description: task.description,
      seconds: task.seconds,
      date: task.date,
      status: status.name,
      taskDefinitionName: taskDefinition.name,
      projectName: project.name,
    })
    .from(task)
    .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(status, eq(task.statusId, status.id))
    .where(
      and(
        eq(task.taskDefinitionId, parseInt(taskDefinitionId)),
        eq(task.date, targetDate),
      ),
    )
    .limit(1)

  if (result.length === 0) {
    return null
  }

  const t = result[0]
  return {
    id: t.id.toString(),
    name: t.taskDefinitionName,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.projectName,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status,
  }
}

const getTaskById = async (
  db: ReturnType<typeof drizzle>,
  taskId: string,
): Promise<DBTask | null> => {
  const result = await db
    .select({
      id: task.id,
      taskDefinitionId: task.taskDefinitionId,
      description: task.description,
      seconds: task.seconds,
      date: task.date,
      status: status.name,
      taskDefinitionName: taskDefinition.name,
      projectName: project.name,
      companyName: company.name,
    })
    .from(task)
    .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(company, eq(project.companyId, company.id))
    .innerJoin(status, eq(task.statusId, status.id))
    .where(eq(task.id, parseInt(taskId, 10)))
    .limit(1)

  if (result.length === 0) {
    return null
  }

  const t = result[0]
  return {
    id: t.id.toString(),
    name: t.taskDefinitionName,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.projectName,
    companyName: t.companyName,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status,
  }
}

const getSearchResult = async (
  db: ReturnType<typeof drizzle>,
  q: SearchQuery,
): Promise<SearchQueryResult> => {
  const project_name = q.task.project_name.replace(/\*/g, '%')
  const task_name = q.task.task_name.replace(/\*/g, '%')
  const task_description = q.task.task_description.replace(/\*/g, '%')
  const task_definition_name = q.task.task_definition_name.replace(/\*/g, '%')
  const company_name = q.task.company_name.replace(/\*/g, '%')

  const results: SearchQueryResult = {
    companies: [],
    projects: [],
    task_definitions: [],
    tasks: [],
  }

  // Filter by status if specified
  let statusId: number | undefined
  if (q.active_state === 'active' || q.active_state === 'inactive') {
    const statusResult = await db
      .select()
      .from(status)
      .where(eq(status.name, q.active_state))
      .limit(1)
    statusId = statusResult[0]?.id
  }

  if (q.search_in.includes('companies')) {
    let query = db
      .select({
        id: company.id,
        name: company.name,
        status: status.name,
      })
      .from(company)
      .innerJoin(status, eq(company.statusId, status.id))

    if (company_name !== '%' && company_name !== '*') {
      query = query.where(
        like(company.name, `%${company_name.replace(/%/g, '')}%`),
      ) as any
    }

    if (statusId) {
      query = query.where(eq(company.statusId, statusId)) as any
    }

    const companies = await query
    results.companies = companies.map(c => ({
      id: c.id.toString(),
      name: c.name,
      status: c.status,
    }))
  }

  if (q.search_in.includes('projects')) {
    let query = db
      .select({
        id: project.id,
        name: project.name,
        companyId: project.companyId,
        companyName: company.name,
        status: status.name,
      })
      .from(project)
      .innerJoin(company, eq(project.companyId, company.id))
      .innerJoin(status, eq(project.statusId, status.id))

    const conditions = []
    if (project_name !== '%' && project_name !== '*') {
      conditions.push(like(project.name, `%${project_name.replace(/%/g, '')}%`))
    }
    if (company_name !== '%' && company_name !== '*') {
      conditions.push(like(company.name, `%${company_name.replace(/%/g, '')}%`))
    }
    if (statusId) {
      conditions.push(eq(project.statusId, statusId))
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }

    const projects = await query
    results.projects = projects.map(p => ({
      id: p.id.toString(),
      name: p.name,
      companyId: p.companyId.toString(),
      companyName: p.companyName,
      company: { id: p.companyId.toString(), name: p.companyName },
      status: p.status,
    }))
  }

  if (q.search_in.includes('task_definitions')) {
    const conditions = []
    if (task_definition_name !== '%' && task_definition_name !== '*') {
      conditions.push(
        like(
          taskDefinition.name,
          `%${task_definition_name.replace(/%/g, '')}%`,
        ),
      )
    }
    if (project_name !== '%' && project_name !== '*') {
      conditions.push(like(project.name, `%${project_name.replace(/%/g, '')}%`))
    }
    if (statusId) {
      conditions.push(eq(taskDefinition.statusId, statusId))
    }

    let query = db
      .select({
        id: taskDefinition.id,
        name: taskDefinition.name,
        projectId: taskDefinition.projectId,
        projectName: project.name,
        status: status.name,
      })
      .from(taskDefinition)
      .innerJoin(project, eq(taskDefinition.projectId, project.id))
      .innerJoin(status, eq(taskDefinition.statusId, status.id))

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any
    }

    const taskDefs = await query
    results.task_definitions = taskDefs.map(td => ({
      id: td.id.toString(),
      name: td.name,
      projectId: td.projectId.toString(),
      projectName: td.projectName,
      status: td.status,
    }))
  }

  if (q.search_in.includes('tasks')) {
    const fromDateParts = q.from_date.split('-')
    const toDateParts = q.to_date.split('-')

    const fromDate = new Date(
      parseInt(fromDateParts[0]),
      parseInt(fromDateParts[1]) - 1,
      parseInt(fromDateParts[2]),
      0,
      0,
      0,
      0,
    )

    const toDate = new Date(
      parseInt(toDateParts[0]),
      parseInt(toDateParts[1]) - 1,
      parseInt(toDateParts[2]),
      0,
      0,
      0,
      0,
    )
    const toDateEnd = new Date(toDate)
    toDateEnd.setDate(toDateEnd.getDate() + 1)

    const conditions = [gte(task.date, fromDate), lt(task.date, toDateEnd)]

    if (task_name !== '%' && task_name !== '*') {
      conditions.push(
        like(taskDefinition.name, `%${task_name.replace(/%/g, '')}%`),
      )
    }
    if (project_name !== '%' && project_name !== '*') {
      conditions.push(like(project.name, `%${project_name.replace(/%/g, '')}%`))
    }
    if (task_description !== '%' && task_description !== '*') {
      conditions.push(
        like(task.description, `%${task_description.replace(/%/g, '')}%`),
      )
    }
    if (statusId) {
      conditions.push(eq(task.statusId, statusId))
    }

    const tasks = await db
      .select({
        id: task.id,
        taskDefinitionId: task.taskDefinitionId,
        description: task.description,
        seconds: task.seconds,
        date: task.date,
        status: status.name,
        taskDefinitionName: taskDefinition.name,
        projectName: project.name,
      })
      .from(task)
      .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
      .innerJoin(project, eq(taskDefinition.projectId, project.id))
      .innerJoin(status, eq(task.statusId, status.id))
      .where(and(...conditions))

    results.tasks = tasks.map(t => ({
      id: t.id.toString(),
      name: t.taskDefinitionName,
      taskDefinitionId: t.taskDefinitionId.toString(),
      projectName: t.projectName,
      date: t.date.toISOString().split('T')[0],
      description: t.description || '',
      seconds: t.seconds,
      status: t.status,
    }))
  }

  return results
}

const getDataForPDFExport = async (
  db: ReturnType<typeof drizzle>,
  q: PDFQuery,
): Promise<PDFQueryResult[]> => {
  const fromDateParts = q.from.split('-')
  const toDateParts = q.to.split('-')

  const fromDate = new Date(
    parseInt(fromDateParts[0]),
    parseInt(fromDateParts[1]) - 1,
    parseInt(fromDateParts[2]),
    0,
    0,
    0,
    0,
  )

  const toDate = new Date(
    parseInt(toDateParts[0]),
    parseInt(toDateParts[1]) - 1,
    parseInt(toDateParts[2]),
    0,
    0,
    0,
    0,
  )
  const toDateEnd = new Date(toDate)
  toDateEnd.setDate(toDateEnd.getDate() + 1)

  logger.info(
    `PDF Export query: from=${q.from}, to=${q.to}, tasks=${JSON.stringify(q.tasks)}`,
  )
  logger.info(
    `PDF Export date range: ${fromDate.toISOString()} to ${toDateEnd.toISOString()}`,
  )

  // Find all matching task definitions
  const taskDefIds: number[] = []
  for (const taskQuery of q.tasks) {
    const projectResult = await db
      .select()
      .from(project)
      .where(eq(project.name, taskQuery.project_name))
      .limit(1)

    if (projectResult.length === 0) {
      continue
    }

    const taskDefResult = await db
      .select()
      .from(taskDefinition)
      .where(
        and(
          eq(taskDefinition.name, taskQuery.name),
          eq(taskDefinition.projectId, projectResult[0].id),
        ),
      )
      .limit(1)

    if (taskDefResult.length > 0) {
      taskDefIds.push(taskDefResult[0].id)
    }
  }

  logger.info(
    `Task definition IDs:`,
    taskDefIds.map(id => id.toString()),
  )

  if (taskDefIds.length === 0) {
    return []
  }

  const res = await db
    .select({
      name: taskDefinition.name,
      projectName: project.name,
      date: task.date,
      description: task.description,
      seconds: task.seconds,
    })
    .from(task)
    .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .where(
      and(
        gte(task.date, fromDate),
        lt(task.date, toDateEnd),
        inArray(task.taskDefinitionId, taskDefIds),
      ),
    )

  logger.info(`PDF Export found ${res.length} tasks matching criteria`)

  return res.map(t => ({
    name: t.name,
    projectName: t.projectName,
    date: t.date.toISOString().split('T')[0],
    description: t.description || '',
    seconds: t.seconds,
  }))
}

const saveActiveTask = async (
  db: ReturnType<typeof drizzle>,
  taskData: Task,
) => {
  await db
    .update(task)
    .set({ seconds: taskData.seconds })
    .where(eq(task.id, parseInt(taskData.taskId, 10)))
}

const saveActiveTasks = async (
  db: ReturnType<typeof drizzle>,
  tasks: Task[],
) => {
  await Promise.all(
    tasks.map(async taskData => {
      await db
        .update(task)
        .set({ seconds: taskData.seconds })
        .where(eq(task.id, parseInt(taskData.taskId)))
    }),
  )
}

// Company functions
const getCompanies = async (
  db: ReturnType<typeof drizzle>,
): Promise<DBCompany[]> => {
  const companies = await db
    .select({
      id: company.id,
      name: company.name,
      status: status.name,
    })
    .from(company)
    .innerJoin(status, eq(company.statusId, status.id))

  return companies.map(c => ({
    id: c.id.toString(),
    name: c.name,
    status: c.status,
  }))
}

const addCompany = async (db: ReturnType<typeof drizzle>, name: string) => {
  const activeStatusId = await getOrCreateStatus(db, 'active')
  const result = await db
    .insert(company)
    .values({
      name,
      statusId: activeStatusId,
    })
    .returning({ id: company.id })

  return { success: true, id: result[0].id.toString() }
}

const editCompany = async (
  db: ReturnType<typeof drizzle>,
  opts: DBEditCompanyOpts,
) => {
  const updateData: { name: string; statusId?: number } = { name: opts.name }
  if (opts.status !== undefined) {
    const statusId = await getOrCreateStatus(db, opts.status)
    updateData.statusId = statusId
  }

  await db
    .update(company)
    .set(updateData)
    .where(eq(company.id, parseInt(opts.id)))

  return { success: true }
}

const deleteCompany = async (db: ReturnType<typeof drizzle>, id: string) => {
  await db.delete(company).where(eq(company.id, parseInt(id)))
  return { success: true }
}

// Project functions
const getProjects = async (
  db: ReturnType<typeof drizzle>,
  companyId?: string,
): Promise<DBProject[]> => {
  let query = db
    .select({
      id: project.id,
      name: project.name,
      companyId: project.companyId,
      companyName: company.name,
      status: status.name,
    })
    .from(project)
    .innerJoin(company, eq(project.companyId, company.id))
    .innerJoin(status, eq(project.statusId, status.id))

  if (companyId) {
    query = query.where(eq(project.companyId, parseInt(companyId))) as any
  }

  const projects = await query
  return projects.map(p => ({
    id: p.id.toString(),
    name: p.name,
    companyId: p.companyId.toString(),
    companyName: p.companyName,
    company: { id: p.companyId.toString(), name: p.companyName },
    status: p.status,
  }))
}

const addProject = async (
  db: ReturnType<typeof drizzle>,
  name: string,
  companyId: string,
) => {
  const activeStatusId = await getOrCreateStatus(db, 'active')
  const result = await db
    .insert(project)
    .values({
      name,
      companyId: parseInt(companyId),
      statusId: activeStatusId,
    })
    .returning({ id: project.id })

  return { success: true, id: result[0].id.toString() }
}

const editProject = async (
  db: ReturnType<typeof drizzle>,
  opts: DBEditProjectOpts,
) => {
  const updateData: {
    name: string
    companyId: number
    statusId?: number
  } = {
    name: opts.name,
    companyId: parseInt(opts.companyId),
  }
  if (opts.status !== undefined) {
    const statusId = await getOrCreateStatus(db, opts.status)
    updateData.statusId = statusId
  }

  await db
    .update(project)
    .set(updateData)
    .where(eq(project.id, parseInt(opts.id)))

  return { success: true }
}

const deleteProject = async (db: ReturnType<typeof drizzle>, id: string) => {
  await db.delete(project).where(eq(project.id, parseInt(id)))
  return { success: true }
}

const addTaskDefinition = async (
  db: ReturnType<typeof drizzle>,
  opts: DBAddTaskDefinitionOpts,
) => {
  const activeStatusId = await getOrCreateStatus(db, 'active')
  const result = await db
    .insert(taskDefinition)
    .values({
      name: opts.name,
      projectId: parseInt(opts.projectId),
      statusId: activeStatusId,
    })
    .returning({ id: taskDefinition.id })

  return { success: true, id: result[0].id.toString() }
}

const editTaskDefinition = async (
  db: ReturnType<typeof drizzle>,
  opts: DBEditTaskDefinitionOpts,
) => {
  const updateData: { name: string; statusId?: number } = {
    name: opts.name,
  }
  if (opts.status !== undefined) {
    const statusId = await getOrCreateStatus(db, opts.status)
    updateData.statusId = statusId
  }

  await db
    .update(taskDefinition)
    .set(updateData)
    .where(eq(taskDefinition.id, parseInt(opts.id)))

  return { success: true }
}

const deleteTaskDefinition = async (
  db: ReturnType<typeof drizzle>,
  opts: DBDeleteTaskDefinitionOpts,
) => {
  await db
    .delete(taskDefinition)
    .where(eq(taskDefinition.id, parseInt(opts.id)))

  return { success: true }
}

const getTaskDefinitions = async (
  db: ReturnType<typeof drizzle>,
  projectId: string,
): Promise<DBTaskDefinition[]> => {
  const tasks = await db
    .select({
      id: taskDefinition.id,
      name: taskDefinition.name,
      projectId: taskDefinition.projectId,
      projectName: project.name,
      status: status.name,
    })
    .from(taskDefinition)
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(status, eq(taskDefinition.statusId, status.id))
    .where(eq(taskDefinition.projectId, parseInt(projectId)))

  return tasks.map(t => ({
    id: t.id.toString(),
    name: t.name,
    projectId: t.projectId.toString(),
    projectName: t.projectName,
    status: t.status,
  }))
}

const getAllTaskDefinitions = async (
  db: ReturnType<typeof drizzle>,
): Promise<DBTaskDefinition[]> => {
  const res = await db
    .select({
      id: taskDefinition.id,
      name: taskDefinition.name,
      projectId: taskDefinition.projectId,
      projectName: project.name,
      status: status.name,
    })
    .from(taskDefinition)
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(status, eq(taskDefinition.statusId, status.id))

  return res.map(t => ({
    id: t.id.toString(),
    name: t.name,
    projectId: t.projectId.toString(),
    projectName: t.projectName,
    status: t.status,
  }))
}

const addTask = async (db: ReturnType<typeof drizzle>, opts: DBAddTaskOpts) => {
  const activeStatusId = await getOrCreateStatus(db, 'active')
  const result = await db
    .insert(task)
    .values({
      taskDefinitionId: parseInt(opts.taskDefinitionId),
      description: opts.description,
      seconds: opts.seconds,
      statusId: activeStatusId,
    })
    .returning({ id: task.id })

  return { success: true, id: result[0].id.toString() }
}

const editTask = async (
  db: ReturnType<typeof drizzle>,
  opts: DBEditTaskOpts,
) => {
  const oldDateStr = opts.oldDate.split('T')[0]
  const newDateStr = opts.date.split('T')[0]

  const newDateParts = newDateStr.split('-')
  const newDate = new Date(
    Date.UTC(
      parseInt(newDateParts[0]),
      parseInt(newDateParts[1]) - 1,
      parseInt(newDateParts[2]),
      0,
      0,
      0,
      0,
    ),
  )

  const oldDate = new Date(
    Date.UTC(
      parseInt(oldDateStr.split('-')[0]),
      parseInt(oldDateStr.split('-')[1]) - 1,
      parseInt(oldDateStr.split('-')[2]),
      0,
      0,
      0,
      0,
    ),
  )

  const existingTaskResult = await db
    .select()
    .from(task)
    .where(eq(task.id, parseInt(opts.id)))
    .limit(1)

  if (existingTaskResult.length === 0) {
    throw new Error(`Task not found: ${opts.id}`)
  }

  const existingTask = existingTaskResult[0]

  // If date changed, delete and recreate
  if (oldDateStr !== newDateStr) {
    await db.transaction(async tx => {
      await tx.delete(task).where(eq(task.id, parseInt(opts.id)))

      const activeStatusId = await getOrCreateStatus(tx, 'active')
      const statusId =
        opts.status !== undefined
          ? await getOrCreateStatus(tx, opts.status)
          : activeStatusId

      await tx.insert(task).values({
        taskDefinitionId: parseInt(opts.taskDefinitionId),
        description: opts.description,
        date: newDate,
        seconds: opts.seconds,
        statusId,
      })
    })
  } else {
    const activeStatusId = await getOrCreateStatus(db, 'active')
    const updateData: {
      taskDefinitionId?: number
      description: string
      seconds: number
      statusId: number
    } = {
      description: opts.description,
      seconds: opts.seconds,
      statusId: activeStatusId,
    }

    if (opts.status !== undefined) {
      const statusId = await getOrCreateStatus(db, opts.status)
      updateData.statusId = statusId
    }

    // Update task definition if it changed
    if (existingTask.taskDefinitionId.toString() !== opts.taskDefinitionId) {
      updateData.taskDefinitionId = parseInt(opts.taskDefinitionId)
    }

    await db
      .update(task)
      .set(updateData)
      .where(eq(task.id, parseInt(opts.id)))
  }
  return { success: true }
}

const deleteTask = async (
  db: ReturnType<typeof drizzle>,
  opts: DBDeleteTaskOpts,
) => {
  await db.delete(task).where(eq(task.id, parseInt(opts.id)))
  return { success: true }
}

const getTasks = async (
  db: ReturnType<typeof drizzle>,
  projectId: string,
): Promise<DBTask[]> => {
  const tasks = await db
    .select({
      id: task.id,
      taskDefinitionId: task.taskDefinitionId,
      description: task.description,
      seconds: task.seconds,
      date: task.date,
      status: status.name,
      taskDefinitionName: taskDefinition.name,
      projectName: project.name,
    })
    .from(task)
    .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(status, eq(task.statusId, status.id))
    .where(eq(project.id, parseInt(projectId)))

  return tasks.map(t => ({
    id: t.id.toString(),
    name: t.taskDefinitionName,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.projectName,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status,
  }))
}

const getTasksByNameAndProject = async (
  db: ReturnType<typeof drizzle>,
  opts: { taskDefinitionId: string },
): Promise<DBTask[]> => {
  const tasks = await db
    .select({
      id: task.id,
      taskDefinitionId: task.taskDefinitionId,
      description: task.description,
      seconds: task.seconds,
      date: task.date,
      status: status.name,
      taskDefinitionName: taskDefinition.name,
      projectName: project.name,
    })
    .from(task)
    .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(status, eq(task.statusId, status.id))
    .where(eq(task.taskDefinitionId, parseInt(opts.taskDefinitionId)))

  return tasks.map(t => ({
    id: t.id.toString(),
    name: t.taskDefinitionName,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.projectName,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status,
  }))
}

const getTasksToday = async (
  db: ReturnType<typeof drizzle>,
  projectId: string,
): Promise<DBTask[]> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const tasks = await db
    .select({
      id: task.id,
      taskDefinitionId: task.taskDefinitionId,
      description: task.description,
      seconds: task.seconds,
      date: task.date,
      status: status.name,
      taskDefinitionName: taskDefinition.name,
      projectName: project.name,
      companyName: company.name,
    })
    .from(task)
    .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(company, eq(project.companyId, company.id))
    .innerJoin(status, eq(task.statusId, status.id))
    .where(
      and(
        eq(project.id, parseInt(projectId)),
        gte(task.date, today),
        lt(task.date, tomorrow),
      ),
    )

  return tasks.map(t => ({
    id: t.id.toString(),
    name: t.taskDefinitionName,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.projectName,
    companyName: t.companyName,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status,
  }))
}

// Helper functions to query tasks by company and by project
const getTasksByCompany = async (
  db: ReturnType<typeof drizzle>,
  companyId: string,
): Promise<DBTask[]> => {
  const tasks = await db
    .select({
      id: task.id,
      taskDefinitionId: task.taskDefinitionId,
      description: task.description,
      seconds: task.seconds,
      date: task.date,
      status: status.name,
      taskDefinitionName: taskDefinition.name,
      projectName: project.name,
    })
    .from(task)
    .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(company, eq(project.companyId, company.id))
    .innerJoin(status, eq(task.statusId, status.id))
    .where(eq(company.id, parseInt(companyId)))

  return tasks.map(t => ({
    id: t.id.toString(),
    name: t.taskDefinitionName,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.projectName,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status,
  }))
}

const getTasksByProject = async (
  db: ReturnType<typeof drizzle>,
  projectId: string,
): Promise<DBTask[]> => {
  return getTasks(db, projectId)
}

export {
  addCompany,
  addProject,
  addTask,
  addTaskDefinition,
  deleteCompany,
  deleteProject,
  deleteTask,
  deleteTaskDefinition,
  editCompany,
  editProject,
  editTask,
  editTaskDefinition,
  getAllTaskDefinitions,
  getCompanies,
  getDataForPDFExport,
  getProjects,
  getSearchResult,
  getTaskById,
  getTaskByTaskDefinitionAndDate,
  getTaskDefinitions,
  getTasks,
  getTasksByCompany,
  getTasksByNameAndProject,
  getTasksByProject,
  getTasksToday,
  initDB,
  saveActiveTask,
  saveActiveTasks,
}
