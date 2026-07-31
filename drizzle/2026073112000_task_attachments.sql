-- Migration: add TaskAttachment for file blobs bound to Task entries
CREATE TABLE TaskAttachment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  taskId INTEGER NOT NULL REFERENCES Task(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  size INTEGER NOT NULL,
  data BLOB NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX TaskAttachment_taskId_filename_key ON TaskAttachment(taskId, filename);
