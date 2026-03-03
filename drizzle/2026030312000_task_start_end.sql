-- Migration: introduce startDateTime/endDateTime on Task and drop obsolete date/seconds

-- Safety cleanup in case of partial runs
DROP TABLE IF EXISTS Task_se_start_end_migration_backup;
--> statement-breakpoint

-- Backup current Task table structure/data (post 2026010271535_fix_task_date)
ALTER TABLE Task RENAME TO Task_se_start_end_migration_backup;
--> statement-breakpoint

-- Recreate Task table with startDateTime / endDateTime and without date/seconds
CREATE TABLE Task (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskDefinitionId INTEGER NOT NULL REFERENCES TaskDefinition(id) ON DELETE CASCADE,
  description TEXT,
  startDateTime DATETIME NOT NULL,
  endDateTime DATETIME NOT NULL,
  statusId INTEGER NOT NULL REFERENCES Status(id) ON DELETE RESTRICT
);
--> statement-breakpoint

-- Migrate data from backup:
-- - Interpret existing date column as ISO/TEXT or timestamp like previous migration
-- - Compute startDateTime from normalized date
-- - Compute endDateTime as startDateTime + seconds (using UTC)
INSERT INTO Task (id, taskDefinitionId, description, startDateTime, endDateTime, statusId)
SELECT
  id,
  taskDefinitionId,
  description,
-- Normalize existing date to SQLite DATETIME (reuse logic similar to 2026010271535_fix_task_date)
  CASE
    WHEN typeof(date) = 'integer' THEN
      CASE
        WHEN date > 1000000000000 THEN
          datetime(date / 1000, 'unixepoch', 'utc')
        ELSE
          datetime(date, 'unixepoch', 'utc')
      END
    WHEN typeof(date) = 'real' THEN
      CASE
        WHEN CAST(date AS INTEGER) > 1000000000000 THEN
          datetime(CAST(date AS INTEGER) / 1000, 'unixepoch', 'utc')
        ELSE
          datetime(CAST(date AS INTEGER), 'unixepoch', 'utc')
      END
    WHEN typeof(date) = 'text' THEN
      CASE
        WHEN date LIKE '%T%' THEN
          datetime(replace(date, 'T', ' '))
        WHEN date LIKE '____-__-__' AND LENGTH(date) = 10 THEN
          datetime(date || ' 00:00:00', 'utc')
        ELSE date
      END
    ELSE date
  END AS startDateTime,
  -- endDateTime = startDateTime + seconds (seconds is total worked time)
  datetime(
    CASE
      WHEN typeof(date) = 'integer' THEN
        CASE
          WHEN date > 1000000000000 THEN datetime(date / 1000, 'unixepoch', 'utc')
          ELSE datetime(date, 'unixepoch', 'utc')
        END
      WHEN typeof(date) = 'real' THEN
        CASE
          WHEN CAST(date AS INTEGER) > 1000000000000 THEN datetime(CAST(date AS INTEGER) / 1000, 'unixepoch', 'utc')
          ELSE datetime(CAST(date AS INTEGER), 'unixepoch', 'utc')
        END
      WHEN typeof(date) = 'text' THEN
        CASE
          WHEN date LIKE '%T%' THEN datetime(replace(date, 'T', ' '))
          WHEN date LIKE '____-__-__' AND LENGTH(date) = 10 THEN datetime(date || ' 00:00:00', 'utc')
          ELSE datetime(date)
        END
      ELSE datetime(date)
    END,
    printf('+%d seconds', COALESCE(seconds, 0))
  ) AS endDateTime,
  statusId
FROM Task_se_start_end_migration_backup;
--> statement-breakpoint

-- Normalize all Task datetimes into a single canonical SQLite DATETIME
UPDATE Task
SET startDateTime = datetime(startDateTime);
--> statement-breakpoint

UPDATE Task
SET endDateTime = datetime(endDateTime);
--> statement-breakpoint

-- Drop backup table after successful migration
DROP TABLE IF EXISTS Task_se_start_end_migration_backup;

