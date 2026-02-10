-- Initial schema: Status, Company, Project, TaskDefinition, Task
-- IF NOT EXISTS so this is safe on empty DBs and when re-running on existing DBs
CREATE TABLE IF NOT EXISTS Status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS Company (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  statusId INTEGER NOT NULL REFERENCES Status(id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS Project (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  companyId INTEGER NOT NULL REFERENCES Company(id) ON DELETE CASCADE,
  statusId INTEGER NOT NULL REFERENCES Status(id) ON DELETE RESTRICT,
  UNIQUE(name, companyId)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS TaskDefinition (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  projectId INTEGER NOT NULL REFERENCES Project(id) ON DELETE CASCADE,
  statusId INTEGER NOT NULL REFERENCES Status(id) ON DELETE RESTRICT,
  UNIQUE(name, projectId)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS Task (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskDefinitionId INTEGER NOT NULL REFERENCES TaskDefinition(id) ON DELETE CASCADE,
  description TEXT,
  date TEXT NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0,
  statusId INTEGER NOT NULL REFERENCES Status(id) ON DELETE RESTRICT,
  UNIQUE(taskDefinitionId, date)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS Project_name_companyId_key ON Project(name, companyId);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS TaskDefinition_name_projectId_key ON TaskDefinition(name, projectId);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS tasks_task_def_date_IDX ON Task(taskDefinitionId, date);
