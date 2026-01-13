export { PrismaClient } from './../generated/prisma/client'
import { type Prisma, PrismaClient } from './../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import logger from 'node-color-log'
import path from 'node:path'
import { execSync } from 'child_process'
import { getDBFilePath } from './lib/ConfigFile'

let prisma: PrismaClient

type Task = {
  taskId: string
  date: string
  seconds: number
}

export const getPrismaClient = async (): Promise<PrismaClient> => {
  if (!prisma) {
    await initDB()
  }
  return prisma
}

// Helper function to get or create status
// Works with both PrismaClient and transaction clients
const getOrCreateStatus = async (
  prisma: PrismaClient | any,
  statusName: string,
): Promise<number> => {
  let status = await prisma.status.findUnique({
    where: { name: statusName },
  })

  if (!status) {
    status = await prisma.status.create({
      data: { name: statusName },
    })
  }

  return status.id
}

const initDB = async (): Promise<PrismaClient> => {
  const sqlFilePath = await getDBFilePath()

  process.env.DATABASE_URL = `file:${sqlFilePath}`

  // Regenerate Prisma client first to ensure types match schema
  logger.info('🗃️ Regenerating Prisma client...')
  try {
    execSync(`prisma generate`, {
      env: { ...process.env, DATABASE_URL: `file:${sqlFilePath}` },
      stdio: 'pipe',
      cwd: path.join(__dirname, '../..'),
    })
    logger.info('🗃️ Prisma client generated')
  } catch (genError) {
    logger.error('📢 Error generating Prisma client:', genError)
    throw genError
  }

  logger.info('🗃️ Pushing database schema with Prisma...')
  try {
    // Push the schema to create a fresh database
    execSync(`prisma db push --accept-data-loss`, {
      env: { ...process.env, DATABASE_URL: `file:${sqlFilePath}` },
      stdio: 'pipe',
      cwd: path.join(__dirname, '../..'),
    })
    logger.info('🗃️ Database schema pushed successfully')
  } catch (pushError) {
    logger.error('📢 Error pushing schema:', pushError)
    // Re-throw to prevent app from starting with invalid database
    throw pushError
  }

  // Create Prisma client after schema is pushed and client is regenerated
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL!,
  })
  prisma = new PrismaClient({ adapter })

  try {
    // Test connection
    await prisma.$connect()
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')

    // Initialize default statuses if they don't exist
    try {
      await getOrCreateStatus(prisma, 'active')
      await getOrCreateStatus(prisma, 'inactive')
      logger.info('🗃️ Default statuses initialized')
    } catch (statusError) {
      logger.warn(
        '⚠️ Error initializing default statuses (they may already exist):',
        statusError,
      )
      // Don't throw - statuses might already exist from a previous run
    }

    logger.info('🗃️ Database connected successfully')
  } catch (err) {
    logger.error('📢 Error connecting to database file:', sqlFilePath, err)
    throw err
  }

  return prisma
}

const getSearchResult = async (
  prisma: PrismaClient,
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
    const status = await prisma.status.findUnique({
      where: { name: q.active_state },
    })
    statusId = status?.id
  }

  const statusFilter = statusId ? { statusId } : {}

  if (q.search_in.includes('companies')) {
    const companies = await prisma.company.findMany({
      where: {
        name: {
          contains: company_name.replace(/%/g, ''),
        },
        ...statusFilter,
      },
      include: {
        status: true,
      },
    })
    results.companies = companies.map(c => ({
      id: c.id.toString(),
      name: c.name,
      status: c.status.name,
    }))
  }

  if (q.search_in.includes('projects')) {
    const whereClause: Prisma.ProjectWhereInput = {
      name: {
        contains: project_name.replace(/%/g, ''),
      },
      ...statusFilter,
    }

    // If company name filter is specified, filter by company
    if (company_name !== '%' && company_name !== '*') {
      whereClause.company = {
        name: {
          contains: company_name.replace(/%/g, ''),
        },
      }
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        company: true,
        status: true,
      },
    })
    results.projects = projects.map(p => ({
      id: p.id.toString(),
      name: p.name,
      companyId: p.companyId.toString(),
      companyName: p.company.name,
      status: p.status.name,
    }))
  }

  if (q.search_in.includes('task_definitions')) {
    const whereClause: Prisma.TaskDefinitionWhereInput = {
      name: {
        contains: task_definition_name.replace(/%/g, ''),
      },
      project: {
        name: {
          contains: project_name.replace(/%/g, ''),
        },
      },
      ...statusFilter,
    }

    const taskDefs = await prisma.taskDefinition.findMany({
      where: whereClause,
      include: {
        project: true,
        status: true,
      },
    })
    results.task_definitions = taskDefs.map(td => ({
      id: td.id.toString(),
      name: td.name,
      projectId: td.projectId.toString(),
      projectName: td.project.name,
      status: td.status.name,
    }))
  }

  if (q.search_in.includes('tasks')) {
    // Parse dates and set to start of day for from_date
    // and start of next day for to_date (using lt instead of lte)
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

    const whereClause: Prisma.TaskWhereInput = {
      date: {
        gte: fromDate,
        lt: toDateEnd,
      },
      taskDefinition: {
        name: {
          contains: task_name.replace(/%/g, ''),
        },
        project: {
          name: {
            contains: project_name.replace(/%/g, ''),
          },
        },
      },
      description: {
        contains: task_description.replace(/%/g, ''),
      },
      ...statusFilter,
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        taskDefinition: {
          include: {
            project: true,
          },
        },
        status: true,
      },
    })
    results.tasks = tasks.map(t => ({
      id: t.id.toString(),
      name: t.taskDefinition.name,
      taskDefinitionId: t.taskDefinitionId.toString(),
      projectName: t.taskDefinition.project.name,
      date: t.date.toISOString().split('T')[0],
      description: t.description || '',
      seconds: t.seconds,
      status: t.status.name,
    }))
  }

  return results
}

const getDataForPDFExport = async (
  prisma: PrismaClient,
  q: PDFQuery,
): Promise<PDFQueryResult[]> => {
  // Parse date strings as local dates (YYYY-MM-DD format)
  // Create dates at local midnight to match how tasks are stored
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
    `PDF Export query: from=${q.from}, to=${q.to}, tasks=${JSON.stringify(
      q.tasks,
    )}`,
  )
  logger.info(
    `PDF Export date range: ${fromDate.toISOString()} to ${toDateEnd.toISOString()}`,
  )

  // Build OR conditions for each task (name + project_name combination)
  // First, find all matching task definitions
  const taskDefIds = await Promise.all(
    q.tasks.map(async task => {
      const project = await prisma.project.findFirst({
        where: {
          name: task.project_name,
        },
      })

      if (!project) {
        return null
      }

      const taskDef = await prisma.taskDefinition.findFirst({
        where: {
          name: task.name,
          project: {
            id: project.id,
          },
        },
      })

      return taskDef ? taskDef.id : null
    }),
  )

  const validTaskDefIds = taskDefIds.filter((id): id is bigint => id !== null)

  logger.info(
    `Task definition IDs:`,
    validTaskDefIds.map(id => id.toString()),
  )

  // Debug: Check what tasks exist for the selected project/name combination (any date)
  const allTasksForProjectAndName = await prisma.task.findMany({
    where: {
      taskDefinition: {
        id: {
          in: validTaskDefIds,
        },
      },
    },
    include: {
      taskDefinition: {
        include: {
          project: true,
        },
      },
      status: true,
    },
    take: 20,
  })

  logger.info(
    `Found ${allTasksForProjectAndName.length} tasks matching name/project (any date). Sample dates:`,
    allTasksForProjectAndName.map(t => ({
      dateStr: t.date.toISOString().split('T')[0],
      dateISO: t.date.toISOString(),
      dateValue: t.date.getTime(),
    })),
  )

  logger.info(
    `Date range for comparison: fromDate=${fromDate.getTime()} (${fromDate.toISOString()}), toDateEnd=${toDateEnd.getTime()} (${toDateEnd.toISOString()})`,
  )

  const res = await prisma.task.findMany({
    where: {
      date: {
        gte: fromDate,
        lt: toDateEnd,
      },
      taskDefinition: {
        id: {
          in: validTaskDefIds,
        },
      },
    },
    include: {
      taskDefinition: {
        include: {
          project: true,
        },
      },
      status: true,
    },
  })

  logger.info(`PDF Export found ${res.length} tasks matching criteria`)

  return res.map(t => ({
    name: t.taskDefinition.name,
    projectName: t.taskDefinition.project.name,
    date: t.date.toISOString().split('T')[0],
    description: t.description || '',
    seconds: t.seconds,
  }))
}

const saveActiveTask = async (prisma: PrismaClient, task: Task) => {
  // Use taskId directly to update
  await prisma.task.update({
    where: {
      id: parseInt(task.taskId),
    },
    data: {
      seconds: task.seconds,
    },
  })
}

const saveActiveTasks = async (prisma: PrismaClient, tasks: Task[]) => {
  await Promise.all(
    tasks.map(async task => {
      // Use taskId directly to update
      await prisma.task.update({
        where: {
          id: parseInt(task.taskId),
        },
        data: {
          seconds: task.seconds,
        },
      })
    }),
  )
}

// Company functions
const getCompanies = async (prisma: PrismaClient): Promise<DBCompany[]> => {
  const companies = await prisma.company.findMany({
    include: {
      status: true,
    },
  })
  return companies.map(c => ({
    id: c.id.toString(),
    name: c.name,
    status: c.status.name,
  }))
}

const addCompany = async (prisma: PrismaClient, name: string) => {
  const activeStatusId = await getOrCreateStatus(prisma, 'active')
  const company = await prisma.company.create({
    data: {
      name,
      statusId: activeStatusId,
    },
  })
  return { success: true, id: company.id.toString() }
}

const editCompany = async (prisma: PrismaClient, opts: DBEditCompanyOpts) => {
  const updateData: { name: string; statusId?: number } = { name: opts.name }
  if (opts.status !== undefined) {
    const statusId = await getOrCreateStatus(prisma, opts.status)
    updateData.statusId = statusId
  }

  await prisma.company.update({
    where: { id: parseInt(opts.id) },
    data: updateData,
  })
  return { success: true }
}

const deleteCompany = async (prisma: PrismaClient, id: string) => {
  await prisma.company.delete({
    where: { id: parseInt(id) },
  })
  return { success: true }
}

// Project functions
const getProjects = async (
  prisma: PrismaClient,
  companyId?: string,
): Promise<DBProject[]> => {
  const queryOptions: any = {
    include: {
      company: true,
      status: true,
    },
  }

  if (companyId) {
    queryOptions.where = {
      companyId: parseInt(companyId),
    }
  }

  const projects = await prisma.project.findMany(queryOptions)
  return projects.map(p => ({
    id: p.id.toString(),
    name: p.name,
    companyId: p.companyId.toString(),
    companyName: p.company.name,
    status: p.status.name,
  }))
}

const addProject = async (
  prisma: PrismaClient,
  name: string,
  companyId: string,
) => {
  const activeStatusId = await getOrCreateStatus(prisma, 'active')
  const project = await prisma.project.create({
    data: {
      name,
      company: {
        connect: { id: parseInt(companyId) },
      },
      status: {
        connect: { id: activeStatusId },
      },
    },
  })
  return { success: true, id: project.id.toString() }
}

const editProject = async (prisma: PrismaClient, opts: DBEditProjectOpts) => {
  const updateData: {
    name: string
    company: { connect: { id: number } }
    status?: { connect: { id: number } }
  } = {
    name: opts.name,
    company: {
      connect: { id: parseInt(opts.companyId) },
    },
  }
  if (opts.status !== undefined) {
    const statusId = await getOrCreateStatus(prisma, opts.status)
    updateData.status = {
      connect: { id: statusId },
    }
  }

  await prisma.project.update({
    where: { id: parseInt(opts.id) },
    data: updateData,
  })
  return { success: true }
}

const deleteProject = async (prisma: PrismaClient, id: string) => {
  await prisma.project.delete({
    where: { id: parseInt(id) },
  })
  return { success: true }
}

const addTaskDefinition = async (
  prisma: PrismaClient,
  opts: DBAddTaskDefinitionOpts,
) => {
  const activeStatusId = await getOrCreateStatus(prisma, 'active')
  const taskDef = await prisma.taskDefinition.create({
    data: {
      name: opts.name,
      project: {
        connect: { id: parseInt(opts.projectId) },
      },
      status: {
        connect: { id: activeStatusId },
      },
    },
  })
  return { success: true, id: taskDef.id.toString() }
}

const editTaskDefinition = async (
  prisma: PrismaClient,
  opts: DBEditTaskDefinitionOpts,
) => {
  const updateData: { name: string; status?: { connect: { id: number } } } = {
    name: opts.name,
  }
  if (opts.status !== undefined) {
    const statusId = await getOrCreateStatus(prisma, opts.status)
    updateData.status = {
      connect: { id: statusId },
    }
  }

  await prisma.taskDefinition.update({
    where: { id: parseInt(opts.id) },
    data: updateData,
  })
  return { success: true }
}

const deleteTaskDefinition = async (
  prisma: PrismaClient,
  opts: DBDeleteTaskDefinitionOpts,
) => {
  await prisma.taskDefinition.delete({
    where: { id: parseInt(opts.id) },
  })
  return { success: true }
}

const getTaskDefinitions = async (
  prisma: PrismaClient,
  projectId: string,
): Promise<DBTaskDefinition[]> => {
  const tasks = await prisma.taskDefinition.findMany({
    where: {
      projectId: parseInt(projectId),
    },
    include: {
      project: true,
      status: true,
    },
  })
  return tasks.map(t => ({
    id: t.id.toString(),
    name: t.name,
    projectId: t.projectId.toString(),
    projectName: t.project.name,
    status: t.status.name,
  }))
}

const getAllTaskDefinitions = async (
  prisma: PrismaClient,
): Promise<DBTaskDefinition[]> => {
  const res = await prisma.taskDefinition.findMany({
    include: {
      project: true,
      status: true,
    },
  })
  return res.map(t => ({
    id: t.id.toString(),
    name: t.name,
    projectId: t.projectId.toString(),
    projectName: t.project.name,
    status: t.status.name,
  }))
}

const addTask = async (prisma: PrismaClient, opts: DBAddTaskOpts) => {
  const activeStatusId = await getOrCreateStatus(prisma, 'active')
  const task = await prisma.task.create({
    data: {
      taskDefinition: {
        connect: { id: parseInt(opts.taskDefinitionId) },
      },
      description: opts.description,
      seconds: opts.seconds,
      status: {
        connect: { id: activeStatusId },
      },
    },
  })
  return { success: true, id: task.id.toString() }
}

const editTask = async (prisma: PrismaClient, opts: DBEditTaskOpts) => {
  // Normalize date strings to YYYY-MM-DD format for comparison
  const oldDateStr = opts.oldDate.split('T')[0]
  const newDateStr = opts.date.split('T')[0]

  // Create Date objects at UTC midnight to avoid timezone issues
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

  // Find old task by ID
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

  const existingTask = await prisma.task.findUnique({
    where: { id: parseInt(opts.id) },
  })

  if (!existingTask) {
    throw new Error(`Task not found: ${opts.id}`)
  }

  // If date changed, delete and recreate
  if (oldDateStr !== newDateStr) {
    await prisma.$transaction(async tx => {
      await tx.task.delete({
        where: { id: parseInt(opts.id) },
      })

      const statusId =
        opts.status !== undefined
          ? await getOrCreateStatus(tx, opts.status)
          : existingTask.statusId
      await tx.task.create({
        data: {
          taskDefinition: {
            connect: { id: parseInt(opts.taskDefinitionId) },
          },
          description: opts.description,
          date: newDate,
          seconds: opts.seconds,
          statusId,
        },
      })
    })
  } else {
    // Update existing task
    const updateData: {
      taskDefinition?: { connect: { id: number } }
      description: string
      seconds: number
      statusId?: number
    } = {
      description: opts.description,
      seconds: opts.seconds,
    }
    if (opts.status !== undefined) {
      const statusId = await getOrCreateStatus(prisma, opts.status)
      updateData.statusId = statusId
    }
    // Update task definition if it changed
    if (existingTask.taskDefinitionId.toString() !== opts.taskDefinitionId) {
      updateData.taskDefinition = {
        connect: { id: parseInt(opts.taskDefinitionId) },
      }
    }

    await prisma.task.update({
      where: { id: parseInt(opts.id) },
      data: updateData,
    })
  }
  return { success: true }
}

const deleteTask = async (prisma: PrismaClient, opts: DBDeleteTaskOpts) => {
  await prisma.task.delete({
    where: { id: parseInt(opts.id) },
  })
  return { success: true }
}

const getTasks = async (
  prisma: PrismaClient,
  projectId: string,
): Promise<DBTask[]> => {
  const tasks = await prisma.task.findMany({
    where: {
      taskDefinition: {
        projectId: parseInt(projectId),
      },
    },
    include: {
      taskDefinition: {
        include: {
          project: true,
        },
      },
      status: true,
    },
  })
  return tasks.map(t => ({
    id: t.id.toString(),
    name: t.taskDefinition.name,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.taskDefinition.project.name,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status.name,
  }))
}

const getTasksByNameAndProject = async (
  prisma: PrismaClient,
  opts: { taskDefinitionId: string },
): Promise<DBTask[]> => {
  const tasks = await prisma.task.findMany({
    where: {
      taskDefinitionId: parseInt(opts.taskDefinitionId),
    },
    include: {
      taskDefinition: {
        include: {
          project: true,
        },
      },
      status: true,
    },
  })
  return tasks.map(t => ({
    id: t.id.toString(),
    name: t.taskDefinition.name,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.taskDefinition.project.name,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status.name,
  }))
}

const getTasksToday = async (
  prisma: PrismaClient,
  projectId: string,
): Promise<DBTask[]> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const tasks = await prisma.task.findMany({
    where: {
      taskDefinition: {
        projectId: parseInt(projectId),
      },
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      taskDefinition: {
        include: {
          project: true,
        },
      },
      status: true,
    },
  })
  return tasks.map(t => ({
    id: t.id.toString(),
    name: t.taskDefinition.name,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.taskDefinition.project.name,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status.name,
  }))
}

// Helper functions to query tasks by company and by project
const getTasksByCompany = async (
  prisma: PrismaClient,
  companyId: string,
): Promise<DBTask[]> => {
  const tasks = await prisma.task.findMany({
    where: {
      taskDefinition: {
        project: {
          companyId: parseInt(companyId),
        },
      },
    },
    include: {
      taskDefinition: {
        include: {
          project: {
            include: {
              company: true,
            },
          },
        },
      },
      status: true,
    },
  })
  return tasks.map(t => ({
    id: t.id.toString(),
    name: t.taskDefinition.name,
    taskDefinitionId: t.taskDefinitionId.toString(),
    projectName: t.taskDefinition.project.name,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status.name,
  }))
}

const getTasksByProject = async (
  prisma: PrismaClient,
  projectId: string,
): Promise<DBTask[]> => {
  return getTasks(prisma, projectId)
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
