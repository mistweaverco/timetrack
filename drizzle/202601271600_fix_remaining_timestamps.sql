-- Fix remaining timestamp values that weren't converted in the previous migration
-- This migration updates any Task.date values that are still numeric timestamps

-- Update tasks where date is stored as a numeric string (timestamp in seconds)
-- These are values like '1769097465' that should be converted to ISO format
-- We need to handle both cases: timestamps stored as TEXT strings and as INTEGER values

-- First, handle TEXT dates that are numeric strings (like '1769097465')
UPDATE Task
SET date = strftime('%Y-%m-%dT%H:%M:%S.000+00:00', datetime(CAST(date AS INTEGER), 'unixepoch', 'utc'))
WHERE typeof(date) = 'text' 
  AND date NOT LIKE '%T%'
  AND date NOT LIKE '%-%'
  AND date GLOB '[0-9]*'
  AND CAST(date AS INTEGER) > 1000000000
  AND CAST(date AS INTEGER) < 9999999999;

-- Also handle any INTEGER dates that might still exist (shouldn't happen after first migration, but just in case)
UPDATE Task
SET date = strftime('%Y-%m-%dT%H:%M:%S.000+00:00', datetime(date, 'unixepoch', 'utc'))
WHERE typeof(date) = 'integer'
  AND date > 1000000000
  AND date < 9999999999;
