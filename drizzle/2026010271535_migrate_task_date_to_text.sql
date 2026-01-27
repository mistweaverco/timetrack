-- Disable foreign key checks temporarily to allow table operations
PRAGMA foreign_keys = OFF;

-- Drop Task_new if it exists (cleanup from previous incomplete migration)
DROP TABLE IF EXISTS Task_new;

-- Create a new table with TEXT date column
CREATE TABLE Task_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskDefinitionId INTEGER NOT NULL REFERENCES TaskDefinition(id) ON DELETE CASCADE,
  description TEXT,
  date TEXT NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0,
  statusId INTEGER NOT NULL REFERENCES Status(id) ON DELETE RESTRICT,
  UNIQUE(taskDefinitionId, date)
);

-- Copy data from Task table, converting all dates to ISO format
-- Handle INTEGER timestamps (milliseconds), REAL timestamps, and existing TEXT dates
INSERT INTO Task_new (id, taskDefinitionId, description, date, seconds, statusId)
SELECT
  id,
  taskDefinitionId,
  description,
  CASE
    -- If date is INTEGER (timestamp in milliseconds), convert to ISO string
    WHEN typeof(date) = 'integer' THEN
      -- Check if it's milliseconds (> 1e12) or seconds (< 1e10)
      CASE
        WHEN date > 1000000000000 THEN
          -- Milliseconds: divide by 1000, convert to UTC datetime, format as ISO
          strftime('%Y-%m-%dT%H:%M:%S.000+00:00', datetime(date / 1000, 'unixepoch', 'utc'))
        ELSE
          -- Seconds: convert directly to UTC datetime, format as ISO
          strftime('%Y-%m-%dT%H:%M:%S.000+00:00', datetime(date, 'unixepoch', 'utc'))
      END
    -- If date is REAL (floating point timestamp), convert to ISO string
    WHEN typeof(date) = 'real' THEN
      CASE
        WHEN CAST(date AS INTEGER) > 1000000000000 THEN
          strftime('%Y-%m-%dT%H:%M:%S.000+00:00', datetime(CAST(date AS INTEGER) / 1000, 'unixepoch', 'utc'))
        ELSE
          strftime('%Y-%m-%dT%H:%M:%S.000+00:00', datetime(CAST(date AS INTEGER), 'unixepoch', 'utc'))
      END
    -- If date is already TEXT, normalize it to ISO format
    WHEN typeof(date) = 'text' THEN
      CASE
        -- If it already contains 'T' and looks like ISO format, normalize it
        WHEN date LIKE '%T%' THEN
          -- Extract date and time parts, ensure +00:00 timezone
          strftime('%Y-%m-%dT%H:%M:%S.000+00:00', datetime(date))
        -- If it's YYYY-MM-DD format, convert to ISO
        WHEN date LIKE '____-__-__' AND LENGTH(date) = 10 THEN
          strftime('%Y-%m-%dT%H:%M:%S.000+00:00', datetime(date || ' 00:00:00', 'utc'))
        -- Otherwise try to parse it as-is
        ELSE date
      END
    ELSE date
  END as date,
  seconds,
  statusId
FROM Task;

-- Drop the old Task table
DROP TABLE Task;

-- Rename Task_new to Task
ALTER TABLE Task_new RENAME TO Task;

-- Recreate the index
CREATE UNIQUE INDEX IF NOT EXISTS tasks_task_def_date_IDX ON Task(taskDefinitionId, date);

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;
