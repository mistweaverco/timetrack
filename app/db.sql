CREATE TABLE IF NOT EXISTS projects (
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS tasks (
  name TEXT NOT NULL DEFAULT 'default',
  project_name TEXT NOT NULL,
  description TEXT NULL DEFAULT NULL,
  date DATE NOT NULL DEFAULT (DATE('now')),
  seconds INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX tasks_name_date_pjn_IDX ON tasks (name,date,project_name);
CREATE TABLE IF NOT EXISTS task_definitions (
  name TEXT NOT NULL,
  project_name TEXT NOT NULL
);
CREATE UNIQUE INDEX tasks_defs_name_pjn_IDX ON task_definitions (name,project_name);
