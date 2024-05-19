ALTER TABLE tasks RENAME TO tasks_old;

CREATE TABLE tasks (
  name TEXT NOT NULL DEFAULT 'default',
  project_name TEXT NOT NULL,
  description TEXT NULL DEFAULT NULL,
  date DATE NOT NULL DEFAULT (DATE('now','localtime')),
  seconds INTEGER NOT NULL DEFAULT 0
);
INSERT INTO tasks (name,project_name,description,date,seconds) SELECT name,project_name,description,date,seconds FROM tasks_old;

DROP TABLE tasks_old;

UPDATE db_version SET version = '2024-05-19-001' WHERE version = '';
