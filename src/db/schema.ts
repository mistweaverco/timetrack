import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'

export const status = sqliteTable('Status', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
})

export const company = sqliteTable('Company', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  statusId: integer('statusId')
    .notNull()
    .references(() => status.id, { onDelete: 'restrict' }),
})

export const project = sqliteTable(
  'Project',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    companyId: integer('companyId')
      .notNull()
      .references(() => company.id, { onDelete: 'cascade' }),
    statusId: integer('statusId')
      .notNull()
      .references(() => status.id, { onDelete: 'restrict' }),
  },
  table => ({
    nameCompanyUnique: uniqueIndex('Project_name_companyId_key').on(
      table.name,
      table.companyId,
    ),
  }),
)

export const taskDefinition = sqliteTable(
  'TaskDefinition',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    projectId: integer('projectId')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    statusId: integer('statusId')
      .notNull()
      .references(() => status.id, { onDelete: 'restrict' }),
  },
  table => ({
    nameProjectUnique: uniqueIndex('TaskDefinition_name_projectId_key').on(
      table.name,
      table.projectId,
    ),
  }),
)

export const task = sqliteTable(
  'Task',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    taskDefinitionId: integer('taskDefinitionId')
      .notNull()
      .references(() => taskDefinition.id, { onDelete: 'cascade' }),
    description: text('description'),
    date: text('date')
      .notNull()
      .$defaultFn(() => {
        const now = new Date()
        return new Date(
          Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0,
            0,
          ),
        ).toISOString()
      }),
    seconds: integer('seconds').notNull().default(0),
    statusId: integer('statusId')
      .notNull()
      .references(() => status.id, { onDelete: 'restrict' }),
  },
  table => ({
    taskDefDateUnique: uniqueIndex('tasks_task_def_date_IDX').on(
      table.taskDefinitionId,
      table.date,
    ),
  }),
)

// Relations
export const statusRelations = relations(status, ({ many }) => ({
  companies: many(company),
  projects: many(project),
  taskDefinitions: many(taskDefinition),
  tasks: many(task),
}))

export const companyRelations = relations(company, ({ one, many }) => ({
  status: one(status, {
    fields: [company.statusId],
    references: [status.id],
  }),
  projects: many(project),
}))

export const projectRelations = relations(project, ({ one, many }) => ({
  company: one(company, {
    fields: [project.companyId],
    references: [company.id],
  }),
  status: one(status, {
    fields: [project.statusId],
    references: [status.id],
  }),
  taskDefinitions: many(taskDefinition),
}))

export const taskDefinitionRelations = relations(
  taskDefinition,
  ({ one, many }) => ({
    project: one(project, {
      fields: [taskDefinition.projectId],
      references: [project.id],
    }),
    status: one(status, {
      fields: [taskDefinition.statusId],
      references: [status.id],
    }),
    tasks: many(task),
  }),
)

export const taskRelations = relations(task, ({ one }) => ({
  taskDefinition: one(taskDefinition, {
    fields: [task.taskDefinitionId],
    references: [taskDefinition.id],
  }),
  status: one(status, {
    fields: [task.statusId],
    references: [status.id],
  }),
}))

// Type exports
export type Status = InferSelectModel<typeof status>
export type Company = InferSelectModel<typeof company>
export type Project = InferSelectModel<typeof project>
export type TaskDefinition = InferSelectModel<typeof taskDefinition>
export type Task = InferSelectModel<typeof task>
