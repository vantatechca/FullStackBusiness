/*
  # Add Recurrence to Tasks

  ## Summary
  Adds a `recurrence` column to the `tasks` table to track whether a task is
  daily, weekly, monthly, or a one-time task.

  ## Changes
  - `tasks.recurrence` (text, NOT NULL, DEFAULT 'One-Time')
    - Values: 'Daily', 'Weekly', 'Monthly', 'One-Time'

  ## Notes
  - Existing rows will default to 'One-Time'
  - No data is destroyed; this is an additive change
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'recurrence'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN recurrence text NOT NULL DEFAULT 'One-Time';
  END IF;
END $$;
