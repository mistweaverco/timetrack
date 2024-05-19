ALTER TABLE tasks ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE task_definitions ADD COLUMN status TEXT NOT NULL DEFAULT 'active';

UPDATE db_version SET version = '2024-05-19-002' WHERE version = '2024-05-19-001';
