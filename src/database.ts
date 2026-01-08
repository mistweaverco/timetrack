import { PrismaClient } from '@prisma/client'
import logger from 'node-color-log'
import path from 'node:path'
import { execSync } from 'child_process'
import { getUserConfig, getUserDataPath } from './lib/ConfigFile'

let prisma: PrismaClient

type Task = {
  name: string
  project_name: string
  date: string
  seconds: number
}

const initDB = async (): Promise<PrismaClient> => {
  const userConfig = await getUserConfig()
  const userDataPath = await getUserDataPath()
  let sqlFilePath = path.join(userDataPath, 'timetrack.db')
  if (userConfig && userConfig.database_file_path) {
    sqlFilePath = userConfig.database_file_path
    console.warn('🗃️ Using custom database file path', sqlFilePath)
  }

  // Set DATABASE_URL for Prisma before creating client
  process.env.DATABASE_URL = `file:${sqlFilePath}`

  // Create Prisma Client with explicit datasource URL
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${sqlFilePath}`,
      },
    },
  })

  try {
    // Test connection
    await prisma.$connect()
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON')

    // Check if Project table exists (indicates new Prisma schema is initialized)
    const newSchemaTable = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type='table' AND name='Project'
    `

    if (newSchemaTable.length === 0) {
      logger.info('🗃️ Initializing database schema with Prisma...')
      try {
        execSync(`npx prisma db push --skip-generate --accept-data-loss`, {
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

  const results: SearchQueryResult = {
    projects: [],
    task_definitions: [],
    tasks: [],
  }

  if (q.search_in.includes('projects')) {
    results.projects = await prisma.project.findMany({
      where: {
        name: {
          contains: project_name.replace(/%/g, ''),
        },
      },
      select: {
        name: true,
      },
    })
  }

  if (q.search_in.includes('task_definitions')) {
    const taskDefs = await prisma.taskDefinition.findMany({
      where: {
        name: {
          contains: task_definition_name.replace(/%/g, ''),
        },
        projectName: {
          contains: project_name.replace(/%/g, ''),
        },
      },
      select: {
        name: true,
        projectName: true,
      },
    })
    results.task_definitions = taskDefs.map(td => ({
      name: td.name,
      project_name: td.projectName,
    }))
  }

  if (q.search_in.includes('tasks')) {
    const tasks = await prisma.task.findMany({
      where: {
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
      },
      select: {
        name: true,
        projectName: true,
        date: true,
        description: true,
        seconds: true,
      },
    })
    results.tasks = tasks.map(t => ({
      name: t.name,
      project_name: t.projectName,
      date: t.date.toISOString().split('T')[0],
      description: t.description || '',
      seconds: t.seconds,
    }))
  }

  return results
}

const getDataForPDFExport = async (
  prisma: PrismaClient,
  q: PDFQuery,
): Promise<PDFQueryResult[]> => {
  const taskNames = q.tasks.map(task => task.name)
  const res = await prisma.task.findMany({
    where: {
      date: {
        gte: new Date(q.from),
        lte: new Date(q.to),
      },
      name: {
        in: taskNames,
      },
    },
  })
  return res.map(t => ({
    name: t.name,
    project_name: t.projectName,
    date: t.date.toISOString().split('T')[0],
    description: t.description || '',
    seconds: t.seconds,
  }))
}

const saveActiveTask = async (prisma: PrismaClient, task: Task) => {
  await prisma.task.updateMany({
    where: {
      name: task.name,
      projectName: task.project_name,
      date: new Date(task.date),
    },
    data: {
      seconds: task.seconds,
    },
  })
}

const saveActiveTasks = async (prisma: PrismaClient, tasks: Task[]) => {
  await Promise.all(
    tasks.map(task =>
      prisma.task.updateMany({
        where: {
          name: task.name,
          projectName: task.project_name,
          date: new Date(task.date),
        },
        data: {
          seconds: task.seconds,
        },
      }),
    ),
  )
}

const getProjects = async (prisma: PrismaClient): Promise<DBProject[]> => {
  const projects = await prisma.project.findMany()
  return projects.map(p => ({ name: p.name }))
}

const addProject = async (prisma: PrismaClient, name: string) => {
  await prisma.project.create({
    data: {
      name,
    },
  })
  return { success: true }
}

const editProject = async (prisma: PrismaClient, opts: DBEditProjectOpts) => {
  await prisma.$transaction([
    prisma.project.update({
      where: { name: opts.oldname },
      data: { name: opts.name },
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
  await prisma.$transaction([
    prisma.taskDefinition.updateMany({
      where: {
        name: opts.oldname,
        projectName: opts.project_name,
      },
      data: {
        name: opts.name,
      },
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
  }))
}

const getAllTaskDefinitions = async (
  prisma: PrismaClient,
): Promise<DBTaskDefinition[]> => {
  const res = await prisma.taskDefinition.findMany()
  return res.map(t => ({
    name: t.name,
    project_name: t.projectName,
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
  await prisma.task.updateMany({
    where: {
      name: opts.name,
      date: new Date(opts.date),
      projectName: opts.project_name,
    },
    data: {
      name: opts.name,
      description: opts.description,
      seconds: opts.seconds,
    },
  })
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
  }))
}

export {
  addProject,
  addTask,
  addTaskDefinition,
  deleteProject,
  deleteTask,
  deleteTaskDefinition,
  editProject,
  editTask,
  editTaskDefinition,
  getAllTaskDefinitions,
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
