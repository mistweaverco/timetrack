import { app } from 'electron'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { alias } from 'drizzle-orm/sqlite-core'
import logger from 'node-color-log'
import fs from 'fs'
import path from 'path'
import { getDBFilePath } from './lib/ConfigFile'
import { company, project, status, task, taskDefinition } from './db/schema'
import { and, eq, inArray, like, sql } from 'drizzle-orm'
import { migrate } from 'drizzle-orm/libsql/migrator'

// Helper function to convert date string (YYYY-MM-DD) to ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ)
const dateStringToISO = (dateStr: string): string => {
  // If already in ISO format, return as is
  if (dateStr.includes('T')) {
    return dateStr
  }
  // Convert YYYY-MM-DD to ISO format
  const dateParts = dateStr.split('-')
  const date = new Date(
    Date.UTC(
      parseInt(dateParts[0]),
      parseInt(dateParts[1]) - 1,
      parseInt(dateParts[2]),
      0,
      0,
      0,
      0,
    ),
  )
  return date.toISOString()
}

// Helper function to normalize date string for comparison
const normalizeDateString = (dateStr: string): string => {
  if (dateStr.includes('T')) {
    // Already ISO format, extract date part
    return dateStr.split('T')[0]
  }
  return dateStr
}

let db: ReturnType<typeof drizzle> | null = null
let dbFilePathOverride: string | null = null

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

/**
 * Configure the database file path to be used for this application run.
 * Must be called before the first call to `initDB` / `getDatabase`.
 */
export const setDatabaseFilePath = (filePath: string) => {
  if (db) {
    logger.warn(
      '⚠️ Database file path override was set after initialization; ignoring.',
    )
    return
  }
  dbFilePathOverride = filePath
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
  const sqlFilePath = dbFilePathOverride ?? (await getDBFilePath())

  logger.info('🗃️ Initializing database with Drizzle...')

  // Create raw libsql client
  const client = createClient({ url: `file:${sqlFilePath}` })

  // Create Drizzle instance
  db = drizzle(client)

  // Run migrations programmatically
  try {
    // Determine migrations folder path
    // should be in asar unpacked resources if packaged with Electron
    // during development, it can be relative to the project root
    // so we check for is development mode first
    const migrationsPath = !app.isPackaged
      ? path.join(__dirname, '..', '..', 'drizzle')
      : path.join(process.resourcesPath, 'app.asar.unpacked', 'drizzle')

    // Check if migrations folder exists
    if (fs.existsSync(migrationsPath)) {
      logger.info('🗃️ Running database migrations...')
      logger.info(`🗃️ Migrations folder: ${migrationsPath}`)

      try {
        await client.execute('PRAGMA foreign_keys = OFF;')
        await migrate(db, {
          migrationsFolder: migrationsPath,
        })
      } catch (migrateErr: unknown) {
        logger.error('🗃️ Migration error details:', migrateErr)
        throw migrateErr
      }
      await client.execute('PRAGMA foreign_keys = ON;')

      logger.info('🗃️ Database migrations completed')
    } else {
      logger.warn(
        '⚠️ No migrations folder found. Please ensure migrations are set up.',
        migrationsPath,
      )
    }
  } catch (migrateError) {
    logger.error('📢 Migration error:', migrateError)
    throw migrateError
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

const getTaskByTaskDefinitionAndDate = async (
  db: ReturnType<typeof drizzle>,
  taskDefinitionId: string,
  date: string,
): Promise<DBTask | null> => {
  // Normalize date to ISO format for comparison
  const targetDateISO = dateStringToISO(date)
  const targetDateNormalized = normalizeDateString(targetDateISO)

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
    .innerJoin(status, eq(task.statusId, status.id))
    .innerJoin(company, eq(project.companyId, company.id))
    .where(
      and(
        eq(task.taskDefinitionId, parseInt(taskDefinitionId)),
        // Compare date strings - handle both ISO format and YYYY-MM-DD format
        sql`DATE(${task.date}) = DATE(${sql.raw(`'${targetDateNormalized}'`)})`,
      ),
    )
    .limit(1)

  if (result.length === 0) {
    return null
  }

  const t = result[0]
  // Handle date as string (could be ISO or YYYY-MM-DD)
  const taskDate =
    typeof t.date === 'string' ? t.date : (t.date as Date).toISOString()
  const dateStr = normalizeDateString(taskDate)

  return {
    id: t.id.toString(),
    name: t.taskDefinitionName,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.projectName,
    description: t.description || '',
    seconds: t.seconds,
    date: dateStr,
    status: t.status,
    companyName: t.companyName,
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
  // Handle date as string (could be ISO or YYYY-MM-DD format)
  const taskDate =
    typeof t.date === 'string' ? t.date : (t.date as Date).toISOString()
  const dateStr = normalizeDateString(taskDate)

  return {
    id: t.id.toString(),
    name: t.taskDefinitionName,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.projectName,
    companyName: t.companyName,
    description: t.description || '',
    seconds: t.seconds,
    date: dateStr,
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
      // Use exact match when a specific company is selected
      query = query.where(
        eq(company.name, company_name.replace(/%/g, '')),
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
      // Use exact match when a specific company is selected
      conditions.push(eq(company.name, company_name.replace(/%/g, '')))
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
    // Convert date strings to ISO format for comparison
    const fromDateISO = dateStringToISO(q.from_date)
    const toDateISO = dateStringToISO(q.to_date)

    // For date string comparison, we compare the date part only
    // Dates are stored as ISO strings, so we can compare them directly
    const conditions = [
      sql`DATE(${task.date}) >= DATE(${sql.raw(
        `'${normalizeDateString(fromDateISO)}'`,
      )})`,
      sql`DATE(${task.date}) <= DATE(${sql.raw(
        `'${normalizeDateString(toDateISO)}'`,
      )})`,
    ]

    // Only add filters if they're not wildcards
    if (task_name !== '%' && task_name !== '*') {
      conditions.push(
        like(taskDefinition.name, `%${task_name.replace(/%/g, '')}%`),
      )
    }
    if (project_name !== '%' && project_name !== '*') {
      conditions.push(like(project.name, `%${project_name.replace(/%/g, '')}%`))
    }
    if (company_name !== '%' && company_name !== '*') {
      // Use exact match when a specific company is selected
      conditions.push(eq(company.name, company_name.replace(/%/g, '')))
    }
    if (task_definition_name !== '%' && task_definition_name !== '*') {
      conditions.push(
        like(
          taskDefinition.name,
          `%${task_definition_name.replace(/%/g, '')}%`,
        ),
      )
    }
    if (task_description !== '%' && task_description !== '*') {
      conditions.push(
        like(task.description, `%${task_description.replace(/%/g, '')}%`),
      )
    }
    // Only filter by status if explicitly set to 'active' or 'inactive'
    // 'all' means don't filter by status
    if (statusId !== undefined) {
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
        companyName: company.name,
      })
      .from(task)
      .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
      .innerJoin(project, eq(taskDefinition.projectId, project.id))
      .innerJoin(status, eq(task.statusId, status.id))
      .innerJoin(company, eq(project.companyId, company.id))
      .where(and(...conditions))

    results.tasks = tasks.map(t => {
      // Handle date as string (could be ISO or YYYY-MM-DD format)
      const taskDate =
        typeof t.date === 'string' ? t.date : (t.date as Date).toISOString()
      const dateStr = normalizeDateString(taskDate)

      return {
        id: t.id.toString(),
        name: t.taskDefinitionName,
        taskDefinitionId: t.taskDefinitionId.toString(),
        projectName: t.projectName,
        date: dateStr,
        description: t.description || '',
        seconds: t.seconds,
        status: t.status,
        companyName: t.companyName,
      }
    })
  }

  return results
}

const getDataForPDFExport = async (
  db: ReturnType<typeof drizzle>,
  q: PDFQuery,
): Promise<PDFQueryResult[]> => {
  // Convert date strings to ISO format for comparison
  const fromDateISO = dateStringToISO(q.from)
  const toDateISO = dateStringToISO(q.to)
  const fromDateNormalized = normalizeDateString(fromDateISO)
  const toDateNormalized = normalizeDateString(toDateISO)

  logger.info(
    `PDF Export query: from=${q.from}, to=${q.to}, tasks=${JSON.stringify(
      q.tasks,
    )}`,
  )
  logger.info(
    `PDF Export date range: ${fromDateNormalized} to ${toDateNormalized}`,
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
      companyName: company.name,
      date: task.date,
      description: task.description,
      seconds: task.seconds,
    })
    .from(task)
    .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(company, eq(project.companyId, company.id))
    .where(
      and(
        sql`DATE(${task.date}) >= DATE(${sql.raw(`'${fromDateNormalized}'`)})`,
        sql`DATE(${task.date}) <= DATE(${sql.raw(`'${toDateNormalized}'`)})`,
        inArray(task.taskDefinitionId, taskDefIds),
      ),
    )

  logger.info(`PDF Export found ${res.length} tasks matching criteria`)

  return res.map(t => {
    // Handle date as string (could be ISO or YYYY-MM-DD format)
    const taskDate =
      typeof t.date === 'string' ? t.date : (t.date as Date).toISOString()
    const dateStr = normalizeDateString(taskDate)

    return {
      name: t.name,
      projectName: t.projectName,
      companyName: t.companyName,
      date: dateStr,
      description: t.description || '',
      seconds: t.seconds,
    }
  })
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

const getCompanyByName = async (
  db: ReturnType<typeof drizzle>,
  name: string,
): Promise<DBCompany | null> => {
  const result = await db
    .select({
      id: company.id,
      name: company.name,
      status: status.name,
    })
    .from(company)
    .innerJoin(status, eq(company.statusId, status.id))
    .where(eq(company.name, name))
    .limit(1)
  if (result.length === 0) {
    return null
  }
  const c = result[0]
  return {
    id: c.id.toString(),
    name: c.name,
    status: c.status,
  }
}

const getCompanyById = async (
  db: ReturnType<typeof drizzle>,
  companyId: string,
): Promise<DBCompany | null> => {
  const result = await db
    .select({
      id: company.id,
      name: company.name,
      status: status.name,
    })
    .from(company)
    .innerJoin(status, eq(company.statusId, status.id))
    .where(eq(company.id, parseInt(companyId)))
    .limit(1)
  if (result.length === 0) {
    return null
  }
  const c = result[0]
  return {
    id: c.id.toString(),
    name: c.name,
    status: c.status,
  }
}

// Company functions
const getCompanies = async (
  db: ReturnType<typeof drizzle>,
  statusName?: string,
): Promise<DBCompany[]> => {
  const statusId = await getOrCreateStatus(db, statusName || 'active')
  const companies = await db
    .select({
      id: company.id,
      name: company.name,
      status: status.name,
    })
    .from(company)
    .innerJoin(status, eq(company.statusId, status.id))
    .where(eq(company.statusId, statusId))

  return companies.map(c => ({
    id: c.id.toString(),
    name: c.name,
    status: c.status,
  }))
}

const addCompany = async (
  db: ReturnType<typeof drizzle>,
  name: string,
): Promise<{ success: true; company: DBCompany } | { success: false }> => {
  const existingCompany = await getCompanyByName(db, name)
  const activeStatusId = await getOrCreateStatus(db, 'active')
  if (existingCompany) {
    if (existingCompany.statusId !== activeStatusId) {
      await db
        .update(company)
        .set({ statusId: activeStatusId })
        .where(and(eq(company.id, parseInt(existingCompany.id))))
      existingCompany.status = 'active'
      existingCompany.statusId = activeStatusId
    }
    return { success: true, company: existingCompany }
  }
  const result = await db
    .insert(company)
    .values({
      name,
      statusId: activeStatusId,
    })
    .returning({ id: company.id, name: company.name })

  return {
    success: true,
    company: { id: result[0].id.toString(), name: result[0].name },
  }
}

const mergeCompanies = async (
  db: ReturnType<typeof drizzle>,
  sourceCompanyId: string,
  targetCompanyId: string,
): Promise<{ success: true }> => {
  // We need to update all projects that belong to the source company
  // to belong to the target company first
  await db
    .update(project)
    .set({ companyId: parseInt(targetCompanyId) })
    .where(eq(project.companyId, parseInt(sourceCompanyId)))
  // Now we can delete the source company
  await db.delete(company).where(eq(company.id, parseInt(sourceCompanyId)))
  return { success: true }
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
  statusName?: string,
): Promise<DBProject[]> => {
  statusName = statusName || 'active'
  const statusId = await getOrCreateStatus(db, statusName)
  const query = db
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
    .where(
      companyId
        ? and(eq(project.statusId, statusId), eq(project.statusId, statusId))
        : eq(project.statusId, statusId),
    )

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

const getProjectByName = async (
  db: ReturnType<typeof drizzle>,
  name: string,
  companyId: string,
): Promise<DBProject | null> => {
  const result = await db
    .select({
      id: project.id,
      name: project.name,
      companyId: project.companyId,
      companyName: company.name,
      status: status.name,
      statusId: project.statusId,
    })
    .from(project)
    .innerJoin(company, eq(project.companyId, company.id))
    .innerJoin(status, eq(project.statusId, status.id))
    .where(
      and(eq(project.name, name), eq(project.companyId, parseInt(companyId))),
    )
    .limit(1)
  if (result.length === 0) {
    return null
  }
  const p = result[0]
  return {
    id: p.id.toString(),
    name: p.name,
    companyId: p.companyId.toString(),
    companyName: p.companyName,
    company: { id: p.companyId.toString(), name: p.companyName },
    status: p.status,
  }
}

const getProjectById = async (
  db: ReturnType<typeof drizzle>,
  projectId: string,
): Promise<DBProject | null> => {
  const result = await db
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
    .where(eq(project.id, parseInt(projectId)))
    .limit(1)
  if (result.length === 0) {
    return null
  }
  const p = result[0]
  return {
    id: p.id.toString(),
    name: p.name,
    companyId: p.companyId.toString(),
    companyName: p.companyName,
    company: { id: p.companyId.toString(), name: p.companyName },
    status: p.status,
  }
}

const addProject = async (
  db: ReturnType<typeof drizzle>,
  name: string,
  companyId: string,
): Promise<{ success: true; project: DBProject } | { success: false }> => {
  const existingProject = await getProjectByName(db, name, companyId)
  const activeStatusId = await getOrCreateStatus(db, 'active')
  if (existingProject) {
    if (existingProject.statusId !== activeStatusId) {
      await db
        .update(project)
        .set({ statusId: activeStatusId })
        .where(and(eq(project.id, parseInt(existingProject.id))))
      existingProject.status = 'active'
      existingProject.statusId = activeStatusId
    }
    return { success: true, project: existingProject }
  }
  const result = await db
    .insert(project)
    .values({
      name,
      companyId: parseInt(companyId),
      statusId: activeStatusId,
    })
    .returning({
      id: project.id,
      name: project.name,
    })
  const company = await getCompanyById(db, companyId)

  if (!company) {
    return { success: false }
  }

  return {
    success: true,
    project: {
      id: result[0].id.toString(),
      name: result[0].name,
      companyName: company.name,
      companyId: companyId,
      company: { id: companyId, name: company.name },
    },
  }
}

const mergeProjects = async (
  db: ReturnType<typeof drizzle>,
  sourceProjectId: string,
  targetProjectId: string,
): Promise<{ success: true }> => {
  const existingTaskDefsInTarget = await db
    .select()
    .from(taskDefinition)
    .where(
      and(
        eq(taskDefinition.projectId, parseInt(targetProjectId)),
        inArray(
          taskDefinition.name,
          db
            .select({ name: taskDefinition.name })
            .from(taskDefinition)
            .where(eq(taskDefinition.projectId, parseInt(sourceProjectId))),
        ),
      ),
    )
  for (const existingTD of existingTaskDefsInTarget) {
    const sourceTD = await db
      .select()
      .from(taskDefinition)
      .where(and(eq(taskDefinition.projectId, parseInt(sourceProjectId))))
      .limit(1)
    if (sourceTD.length > 0) {
      await mergeTaskDefinitions(
        db,
        sourceTD[0].id.toString(),
        existingTD.id.toString(),
      )
    }
  }

  // Now we can delete the source project
  await db.delete(project).where(eq(project.id, parseInt(sourceProjectId)))
  return { success: true }
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

const getTaskDefinitionByName = async (
  db: ReturnType<typeof drizzle>,
  name: string,
  projectId: string,
): Promise<DBTaskDefinition | null> => {
  const result = await db
    .select({
      id: taskDefinition.id,
      name: taskDefinition.name,
      projectId: taskDefinition.projectId,
      projectName: project.name,
      statusId: taskDefinition.statusId,
    })
    .from(taskDefinition)
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .where(
      and(
        eq(taskDefinition.name, name),
        eq(taskDefinition.projectId, parseInt(projectId)),
      ),
    )
    .limit(1)
  if (result.length === 0) {
    return null
  }
  const td = result[0]
  return {
    id: td.id.toString(),
    name: td.name,
    projectId: td.projectId.toString(),
    projectName: td.projectName,
    statusId: td.statusId,
  }
}

const addTaskDefinition = async (
  db: ReturnType<typeof drizzle>,
  opts: DBAddTaskDefinitionOpts,
): Promise<
  { success: true; taskDefinition: DBTaskDefinition } | { success: false }
> => {
  const activeStatusId = await getOrCreateStatus(db, 'active')
  const existingTaskDef = await getTaskDefinitionByName(
    db,
    opts.name,
    opts.projectId,
  )
  if (existingTaskDef) {
    if (existingTaskDef.statusId !== activeStatusId) {
      await db
        .update(taskDefinition)
        .set({ statusId: activeStatusId })
        .where(and(eq(taskDefinition.id, parseInt(existingTaskDef.id))))
      existingTaskDef.statusId = activeStatusId
    }
    return { success: true, taskDefinition: existingTaskDef }
  }
  const result = await db
    .insert(taskDefinition)
    .values({
      name: opts.name,
      projectId: parseInt(opts.projectId),
      statusId: activeStatusId,
    })
    .returning({ id: taskDefinition.id, name: taskDefinition.name })

  const project = await getProjectById(db, opts.projectId)
  if (!project) {
    return { success: false }
  }

  return {
    success: true,
    taskDefinition: {
      id: result[0].id.toString(),
      name: result[0].name,
      projectId: opts.projectId,
      projectName: project.name,
    },
  }
}

const mergeTaskDefinitionsByIds = async (
  db: ReturnType<typeof drizzle>,
  sourceTaskDefId: string,
  targetTaskDefId: string,
): Promise<{ success: true } | { success: false }> => {
  await db.transaction(async tx => {
    const sourceTasks = await tx
      .select()
      .from(task)
      .where(eq(task.taskDefinitionId, parseInt(sourceTaskDefId)))

    for (const srcTask of sourceTasks) {
      const sourceTaskDef = alias(taskDefinition, 'sourceTaskDef')

      const targetWithSameNameAsSource = await tx
        .select()
        .from(task)
        .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
        .innerJoin(sourceTaskDef, eq(taskDefinition.name, sourceTaskDef.name))
        .where(
          and(
            eq(taskDefinition.id, parseInt(targetTaskDefId)),
            eq(sourceTaskDef.id, parseInt(sourceTaskDefId)),
          ),
        )
        .limit(1)

      if (targetWithSameNameAsSource.length > 0) {
        // Task exists in target, sum seconds and delete source task
        const targetTask = targetWithSameNameAsSource[0]
        await tx
          .update(task)
          .set({ seconds: targetTask.Task.seconds + srcTask.seconds })
          .where(eq(task.id, targetTask.Task.id))
        await tx.delete(task).where(eq(task.id, srcTask.id))
      } else {
        // Task does not exist in target, update taskDefinitionId
        // to target task definition
        await tx
          .update(task)
          .set({ taskDefinitionId: parseInt(targetTaskDefId) })
          .where(eq(task.id, srcTask.id))
      }
    }

    // Now we can delete the source task definition
    await tx
      .delete(taskDefinition)
      .where(eq(taskDefinition.id, parseInt(sourceTaskDefId)))
  })
  return { success: true }
}

const mergeTaskDefinitions = async (
  db: ReturnType<typeof drizzle>,
  sourceTaskDefId: string,
  targetTaskDefId: string,
): Promise<{ success: true }> => {
  await mergeTaskDefinitionsByIds(db, sourceTaskDefId, targetTaskDefId)
  return { success: true }
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
  // Use today's date in ISO format
  const today = new Date()
  const todayISO = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  ).toISOString()

  const result = await db
    .insert(task)
    .values({
      taskDefinitionId: parseInt(opts.taskDefinitionId),
      description: opts.description,
      seconds: opts.seconds,
      date: todayISO,
      statusId: activeStatusId,
    })
    .returning({ id: task.id })

  return { success: true, id: result[0].id.toString() }
}

const editTask = async (
  db: ReturnType<typeof drizzle>,
  opts: DBEditTaskOpts,
) => {
  const oldDateStr = normalizeDateString(opts.oldDate)
  const newDateStr = normalizeDateString(opts.date)
  const newDateISO = dateStringToISO(newDateStr)

  const existingTaskResult = await db
    .select()
    .from(task)
    .where(eq(task.id, parseInt(opts.id)))
    .limit(1)

  if (existingTaskResult.length === 0) {
    throw new Error(`Task not found: ${opts.id}`)
  }

  const existingTask = existingTaskResult[0]
  const existingDateStr =
    typeof existingTask.date === 'string'
      ? normalizeDateString(existingTask.date)
      : normalizeDateString((existingTask.date as Date).toISOString())

  // If date changed, delete and recreate
  if (oldDateStr !== newDateStr || existingDateStr !== newDateStr) {
    await db.transaction(async tx => {
      await tx.delete(task).where(eq(task.id, parseInt(opts.id)))

      const activeStatusId = await getOrCreateStatus(db, 'active')
      const statusId =
        opts.status !== undefined
          ? await getOrCreateStatus(db, opts.status)
          : activeStatusId

      await tx.insert(task).values({
        taskDefinitionId: parseInt(opts.taskDefinitionId),
        description: opts.description,
        date: newDateISO,
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
      companyName: company.name,
    })
    .from(task)
    .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(status, eq(task.statusId, status.id))
    .innerJoin(company, eq(project.companyId, company.id))
    .where(eq(project.id, parseInt(projectId)))

  return tasks.map(t => {
    // Handle date as string (could be ISO or YYYY-MM-DD format)
    const taskDate =
      typeof t.date === 'string' ? t.date : (t.date as Date).toISOString()
    const dateStr = normalizeDateString(taskDate)

    return {
      id: t.id.toString(),
      name: t.taskDefinitionName,
      taskDefinitionId: t.taskDefinitionId.toString(),
      projectName: t.projectName,
      description: t.description || '',
      seconds: t.seconds,
      date: dateStr,
      status: t.status,
      companyName: t.companyName,
    }
  })
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
      companyName: company.name,
    })
    .from(task)
    .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(status, eq(task.statusId, status.id))
    .innerJoin(company, eq(project.companyId, company.id))
    .where(eq(task.taskDefinitionId, parseInt(opts.taskDefinitionId)))

  return tasks.map(t => {
    // Handle date as string (could be ISO or YYYY-MM-DD format)
    const taskDate =
      typeof t.date === 'string' ? t.date : (t.date as Date).toISOString()
    const dateStr = normalizeDateString(taskDate)

    return {
      id: t.id.toString(),
      name: t.taskDefinitionName,
      taskDefinitionId: t.taskDefinitionId.toString(),
      projectName: t.projectName,
      description: t.description || '',
      seconds: t.seconds,
      date: dateStr,
      status: t.status,
      companyName: t.companyName,
    }
  })
}

const getTasksToday = async (
  db: ReturnType<typeof drizzle>,
  projectId: string,
): Promise<DBTask[]> => {
  // Use today's date in ISO format for comparison
  const today = new Date()
  const todayISO = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  ).toISOString()
  const todayNormalized = normalizeDateString(todayISO)

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
        sql`DATE(${task.date}) = DATE(${sql.raw(`'${todayNormalized}'`)})`,
      ),
    )

  return tasks.map(t => {
    // Handle date as string (could be ISO or YYYY-MM-DD format)
    const taskDate =
      typeof t.date === 'string' ? t.date : (t.date as Date).toISOString()
    const dateStr = normalizeDateString(taskDate)

    return {
      id: t.id.toString(),
      name: t.taskDefinitionName,
      taskDefinitionId: t.taskDefinitionId.toString(),
      projectName: t.projectName,
      companyName: t.companyName,
      description: t.description || '',
      seconds: t.seconds,
      date: dateStr,
      status: t.status,
    }
  })
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
      companyName: company.name,
    })
    .from(task)
    .innerJoin(taskDefinition, eq(task.taskDefinitionId, taskDefinition.id))
    .innerJoin(project, eq(taskDefinition.projectId, project.id))
    .innerJoin(company, eq(project.companyId, company.id))
    .innerJoin(status, eq(task.statusId, status.id))
    .where(eq(company.id, parseInt(companyId)))

  return tasks.map(t => {
    // Handle date as string (could be ISO or YYYY-MM-DD format)
    const taskDate =
      typeof t.date === 'string' ? t.date : (t.date as Date).toISOString()
    const dateStr = normalizeDateString(taskDate)

    return {
      id: t.id.toString(),
      name: t.taskDefinitionName,
      taskDefinitionId: t.taskDefinitionId.toString(),
      projectName: t.projectName,
      description: t.description || '',
      seconds: t.seconds,
      date: dateStr,
      status: t.status,
      companyName: t.companyName,
    }
  })
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
  getCompanyByName,
  getDataForPDFExport,
  getProjectByName,
  getProjects,
  getSearchResult,
  getTaskById,
  getTaskByTaskDefinitionAndDate,
  getTaskDefinitionByName,
  getTaskDefinitions,
  getTasks,
  getTasksByCompany,
  getTasksByNameAndProject,
  getTasksByProject,
  getTasksToday,
  initDB,
  mergeCompanies,
  mergeProjects,
  mergeTaskDefinitions,
  saveActiveTask,
  saveActiveTasks,
}
