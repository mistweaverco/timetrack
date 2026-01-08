export { PrismaClient } from './../generated/prisma/client'
import { PrismaClient } from './../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import logger from 'node-color-log'
import path from 'node:path'
import { execSync } from 'child_process'
import { getDBFilePath } from './lib/ConfigFile'

let prisma: PrismaClient

type Task = {
  name: string
  project_name: string
  date: string
  seconds: number
}

export const getPrismaClient = async (): Promise<PrismaClient> => {
  if (!prisma) {
    await initDB()
  }
  return prisma
}

const initDB = async (): Promise<PrismaClient> => {
  const sqlFilePath = await getDBFilePath()

  process.env.DATABASE_URL = `file:${sqlFilePath}`

  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL!,
  })
  prisma = new PrismaClient({ adapter })

  try {
    // Test connection
    await prisma.$connect()
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')

    // Check if companies table exists (indicates new Prisma schema is initialized)
    const newSchemaTable = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type='table' AND name='companies'
    `
    console.log({ sqlFilePath })

    if (newSchemaTable.length === 0) {
      logger.info('🗃️ Initializing database schema with Prisma...')
      try {
        execSync(`prisma db push --accept-data-loss`, {
          env: { ...process.env, DATABASE_URL: `file:${sqlFilePath}` },
          stdio: 'pipe',
          cwd: path.join(__dirname, '../..'),
        })
        logger.info('🗃️ Database schema initialized successfully')
      } catch (pushError) {
        logger.error('📢 Error pushing schema:', pushError)
        // Re-throw to prevent app from starting with invalid database
        throw pushError
      }
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
  const statusFilter =
    q.active_state === 'active'
      ? { status: 'active' }
      : q.active_state === 'inactive'
        ? { status: 'inactive' }
        : {}

  if (q.search_in.includes('companies')) {
    const companies = await prisma.company.findMany({
      where: {
        name: {
          contains: company_name.replace(/%/g, ''),
        },
        ...statusFilter,
      },
    })
    results.companies = companies.map(c => ({
      name: c.name,
      status: c.status,
    }))
  }

  if (q.search_in.includes('projects')) {
    const whereClause: any = {
      name: {
        contains: project_name.replace(/%/g, ''),
      },
      ...statusFilter,
    }

    // If company name filter is specified, filter by company
    if (company_name !== '%' && company_name !== '*') {
      whereClause.companyName = {
        contains: company_name.replace(/%/g, ''),
      }
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
    })
    results.projects = projects.map(p => ({
      name: p.name,
      company_name: p.companyName,
      status: p.status,
    }))
  }

  if (q.search_in.includes('task_definitions')) {
    const whereClause: any = {
      name: {
        contains: task_definition_name.replace(/%/g, ''),
      },
      projectName: {
        contains: project_name.replace(/%/g, ''),
      },
      ...statusFilter,
    }

    const taskDefs = await prisma.taskDefinition.findMany({
      where: whereClause,
      select: {
        name: true,
        projectName: true,
        status: true,
      },
    })
    results.task_definitions = taskDefs.map(td => ({
      name: td.name,
      project_name: td.projectName,
      status: td.status,
    }))
  }

  if (q.search_in.includes('tasks')) {
    const whereClause: any = {
      date: {
        gte: new Date(q.from_date),
        lte: new Date(q.to_date),
      },
      name: {
        contains: task_name.replace(/%/g, ''),
      },
      description: {
        contains: task_description.replace(/%/g, ''),
      },
      projectName: {
        contains: project_name.replace(/%/g, ''),
      },
      ...statusFilter,
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        name: true,
        projectName: true,
        date: true,
        description: true,
        seconds: true,
        status: true,
      },
    })
    results.tasks = tasks.map(t => ({
      name: t.name,
      project_name: t.projectName,
      date: t.date.toISOString().split('T')[0],
      description: t.description || '',
      seconds: t.seconds,
      status: t.status,
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
  const taskConditions = q.tasks.map(task => ({
    name: task.name,
    projectName: task.project_name,
  }))

  logger.info(`Task conditions:`, JSON.stringify(taskConditions))

  // Debug: Check what tasks exist for the selected project/name combination (any date)
  const allTasksForProjectAndName = await prisma.task.findMany({
    where: {
      OR: taskConditions,
    },
    select: {
      name: true,
      projectName: true,
      date: true,
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
      OR: taskConditions,
    },
  })

  logger.info(`PDF Export found ${res.length} tasks matching criteria`)

  return res.map(t => ({
    name: t.name,
    project_name: t.projectName,
    date: t.date.toISOString().split('T')[0],
    description: t.description || '',
    seconds: t.seconds,
  }))
}

const saveActiveTask = async (prisma: PrismaClient, task: Task) => {
  // Parse date string as local date to match how tasks are stored
  const dateParts = task.date.split('T')[0].split('-')
  const taskDate = new Date(
    parseInt(dateParts[0]),
    parseInt(dateParts[1]) - 1,
    parseInt(dateParts[2]),
    0,
    0,
    0,
    0,
  )
  const taskDateEnd = new Date(taskDate)
  taskDateEnd.setDate(taskDateEnd.getDate() + 1)

  // Find the task by matching date string to avoid timezone issues
  const allMatchingTasks = await prisma.task.findMany({
    where: {
      name: task.name,
      projectName: task.project_name,
    },
  })

  // Find the task by matching date string
  const existingTask = allMatchingTasks.find(t => {
    const taskDateStr = t.date.toISOString().split('T')[0]
    return taskDateStr === task.date.split('T')[0]
  })

  if (existingTask) {
    // Use exact date from database for update
    await prisma.task.updateMany({
      where: {
        name: task.name,
        date: existingTask.date,
        projectName: task.project_name,
      },
      data: {
        seconds: task.seconds,
      },
    })
  } else {
    logger.warn(
      `Task not found for save: ${task.name}, ${task.project_name}, ${task.date}`,
    )
  }
}

const saveActiveTasks = async (prisma: PrismaClient, tasks: Task[]) => {
  await Promise.all(
    tasks.map(async task => {
      // Find the task by matching date string to avoid timezone issues
      const allMatchingTasks = await prisma.task.findMany({
        where: {
          name: task.name,
          projectName: task.project_name,
        },
      })

      // Find the task by matching date string
      const existingTask = allMatchingTasks.find(t => {
        const taskDateStr = t.date.toISOString().split('T')[0]
        return taskDateStr === task.date.split('T')[0]
      })

      if (existingTask) {
        // Use exact date from database for update
        await prisma.task.updateMany({
          where: {
            name: task.name,
            date: existingTask.date,
            projectName: task.project_name,
          },
          data: {
            seconds: task.seconds,
          },
        })
      } else {
        logger.warn(
          `Task not found for save: ${task.name}, ${task.project_name}, ${task.date}`,
        )
      }
    }),
  )
}

// Company functions
const getCompanies = async (prisma: PrismaClient): Promise<DBCompany[]> => {
  const companies = await prisma.company.findMany()
  return companies.map(c => ({ name: c.name, status: c.status }))
}

const addCompany = async (prisma: PrismaClient, name: string) => {
  await prisma.company.create({
    data: {
      name,
    },
  })
  return { success: true }
}

const editCompany = async (prisma: PrismaClient, opts: DBEditCompanyOpts) => {
  const updateData: { name: string; status?: string } = { name: opts.name }
  if (opts.status !== undefined) {
    updateData.status = opts.status
  }

  await prisma.$transaction([
    prisma.company.update({
      where: { name: opts.oldname },
      data: updateData,
    }),
    prisma.project.updateMany({
      where: { companyName: opts.oldname },
      data: { companyName: opts.name },
    }),
  ])
  return { success: true }
}

const deleteCompany = async (prisma: PrismaClient, name: string) => {
  await prisma.company.delete({
    where: { name },
  })
  return { success: true }
}

// Project functions
const getProjects = async (
  prisma: PrismaClient,
  companyName?: string,
): Promise<DBProject[]> => {
  const where = companyName ? { companyName } : {}
  const projects = await prisma.project.findMany({
    where,
  })
  return projects.map(p => ({
    name: p.name,
    company_name: p.companyName,
    status: p.status,
  }))
}

const addProject = async (
  prisma: PrismaClient,
  name: string,
  companyName: string,
) => {
  await prisma.project.create({
    data: {
      name,
      companyName,
    },
  })
  return { success: true }
}

const editProject = async (prisma: PrismaClient, opts: DBEditProjectOpts) => {
  const updateData: { name: string; companyName: string; status?: string } = {
    name: opts.name,
    companyName: opts.company_name,
  }
  if (opts.status !== undefined) {
    updateData.status = opts.status
  }

  await prisma.$transaction([
    prisma.project.update({
      where: { name: opts.oldname },
      data: updateData,
    }),
    prisma.task.updateMany({
      where: { projectName: opts.oldname },
      data: { projectName: opts.name },
    }),
    prisma.taskDefinition.updateMany({
      where: { projectName: opts.oldname },
      data: { projectName: opts.name },
    }),
  ])
  return { success: true }
}

const deleteProject = async (prisma: PrismaClient, name: string) => {
  await prisma.project.delete({
    where: { name },
  })
  return { success: true }
}

const addTaskDefinition = async (
  prisma: PrismaClient,
  opts: DBAddTaskDefinitionOpts,
) => {
  await prisma.taskDefinition.create({
    data: {
      name: opts.name,
      projectName: opts.project_name,
    },
  })
  return { success: true }
}

const editTaskDefinition = async (
  prisma: PrismaClient,
  opts: DBEditTaskDefinitionOpts,
) => {
  const updateData: { name: string; status?: string } = {
    name: opts.name,
  }
  if (opts.status !== undefined) {
    updateData.status = opts.status
  }

  await prisma.$transaction([
    prisma.taskDefinition.updateMany({
      where: {
        name: opts.oldname,
        projectName: opts.project_name,
      },
      data: updateData,
    }),
    prisma.task.updateMany({
      where: {
        name: opts.oldname,
        projectName: opts.project_name,
      },
      data: {
        name: opts.name,
      },
    }),
  ])
  return { success: true }
}

const deleteTaskDefinition = async (
  prisma: PrismaClient,
  opts: DBDeleteTaskDefinitionOpts,
) => {
  await prisma.$transaction([
    prisma.taskDefinition.deleteMany({
      where: {
        name: opts.name,
        projectName: opts.project_name,
      },
    }),
    prisma.task.deleteMany({
      where: {
        name: opts.name,
        projectName: opts.project_name,
      },
    }),
  ])
  return { success: true }
}

const getTaskDefinitions = async (
  prisma: PrismaClient,
  project_name: string,
): Promise<DBTaskDefinition[]> => {
  const tasks = await prisma.taskDefinition.findMany({
    where: {
      projectName: project_name,
    },
  })
  return tasks.map(t => ({
    name: t.name,
    project_name: t.projectName,
    status: t.status,
  }))
}

const getAllTaskDefinitions = async (
  prisma: PrismaClient,
): Promise<DBTaskDefinition[]> => {
  const res = await prisma.taskDefinition.findMany()
  return res.map(t => ({
    name: t.name,
    project_name: t.projectName,
    status: t.status,
  }))
}

const addTask = async (prisma: PrismaClient, opts: DBAddTaskOpts) => {
  await prisma.task.create({
    data: {
      name: opts.name,
      description: opts.description,
      projectName: opts.project_name,
      seconds: opts.seconds,
    },
  })
  return { success: true }
}

const editTask = async (prisma: PrismaClient, opts: DBEditTaskOpts) => {
  // Normalize date strings to YYYY-MM-DD format for comparison
  const oldDateStr = opts.old_date.split('T')[0]
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

  // If date changed, we need to delete and recreate because date is part of unique key
  if (oldDateStr !== newDateStr) {
    try {
      await prisma.$transaction(async tx => {
        // First, find all tasks matching name and project
        const allMatchingTasks = await tx.task.findMany({
          where: {
            name: opts.name,
            projectName: opts.project_name,
          },
        })

        // Find the task by matching date string (more reliable than date range)
        const existingTask = allMatchingTasks.find(t => {
          const taskDateStr = t.date.toISOString().split('T')[0]
          return taskDateStr === oldDateStr
        })

        if (!existingTask) {
          logger.warn(
            `Task not found for date change: ${opts.name}, ${opts.project_name}, ${oldDateStr}. Found tasks with dates: ${allMatchingTasks
              .map(t => t.date.toISOString().split('T')[0])
              .join(', ')}`,
          )
          throw new Error('Task not found')
        }

        // Use the exact date from the database for deletion
        const actualOldDate = existingTask.date

        // Delete old task using exact date match
        const deleteResult = await tx.task.deleteMany({
          where: {
            name: opts.name,
            date: actualOldDate,
            projectName: opts.project_name,
          },
        })

        if (deleteResult.count === 0) {
          logger.warn(
            `Failed to delete old task: ${opts.name}, ${opts.project_name}, ${oldDateStr}`,
          )
          throw new Error('Failed to delete old task')
        }

        // Create new task with updated date
        await tx.task.create({
          data: {
            name: opts.name,
            description: opts.description,
            date: newDate,
            projectName: opts.project_name,
            seconds: opts.seconds,
            status:
              opts.status !== undefined ? opts.status : existingTask.status,
          },
        })

        logger.info(
          `Task date updated: ${opts.name}, ${opts.project_name}, ${oldDateStr} -> ${newDateStr}`,
        )
      })
    } catch (error) {
      logger.error('Error updating task date:', error)
      throw error
    }
  } else {
    // Date hasn't changed, just update normally
    // Find task by matching date string to avoid timezone issues
    const allMatchingTasks = await prisma.task.findMany({
      where: {
        name: opts.name,
        projectName: opts.project_name,
      },
    })

    // Find the task by matching date string
    const existingTask = allMatchingTasks.find(t => {
      const taskDateStr = t.date.toISOString().split('T')[0]
      return taskDateStr === oldDateStr
    })

    if (existingTask) {
      // Use exact date from database for update
      const updateData: {
        name: string
        description: string
        seconds: number
        status?: string
      } = {
        name: opts.name,
        description: opts.description,
        seconds: opts.seconds,
      }
      if (opts.status !== undefined) {
        updateData.status = opts.status
      }

      const updateResult = await prisma.task.updateMany({
        where: {
          name: opts.name,
          date: existingTask.date,
          projectName: opts.project_name,
        },
        data: updateData,
      })

      if (updateResult.count === 0) {
        logger.warn(
          `No task updated: ${opts.name}, ${opts.project_name}, ${oldDateStr}`,
        )
      }
    } else {
      logger.warn(
        `Task not found for update: ${opts.name}, ${opts.project_name}, ${oldDateStr}. Found tasks with dates: ${allMatchingTasks
          .map(t => t.date.toISOString().split('T')[0])
          .join(', ')}`,
      )
    }
  }
  return { success: true }
}

const deleteTask = async (prisma: PrismaClient, opts: DBDeleteTaskOpts) => {
  await prisma.task.deleteMany({
    where: {
      name: opts.name,
      date: new Date(opts.date),
      projectName: opts.project_name,
    },
  })
  return { success: true }
}

const getTasks = async (
  prisma: PrismaClient,
  project_name: string,
): Promise<DBTask[]> => {
  const tasks = await prisma.task.findMany({
    where: {
      projectName: project_name,
    },
  })
  return tasks.map(t => ({
    name: t.name,
    project_name: t.projectName,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status,
  }))
}

const getTasksByNameAndProject = async (
  prisma: PrismaClient,
  opts: { name: string; project_name: string },
): Promise<DBTask[]> => {
  const tasks = await prisma.task.findMany({
    where: {
      name: opts.name,
      projectName: opts.project_name,
    },
  })
  return tasks.map(t => ({
    name: t.name,
    project_name: t.projectName,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status,
  }))
}

const getTasksToday = async (
  prisma: PrismaClient,
  project_name: string,
): Promise<DBTask[]> => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const tasks = await prisma.task.findMany({
    where: {
      projectName: project_name,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  })
  return tasks.map(t => ({
    name: t.name,
    project_name: t.projectName,
    description: t.description || '',
    seconds: t.seconds,
    date: t.date.toISOString().split('T')[0],
    status: t.status,
  }))
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
  getTasksByNameAndProject,
  getTasksToday,
  initDB,
  saveActiveTask,
  saveActiveTasks,
}
