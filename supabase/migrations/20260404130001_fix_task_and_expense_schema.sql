-- ============================================================================
-- V2 Phase 1B: Fix schema mismatches between code and database
-- Adds columns that code expects but migrations never created
-- ============================================================================

-- =====================
-- TASKS: Add multi-assignee and goal tracking columns
-- =====================
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assignees JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS goal_target NUMERIC DEFAULT 0;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS goal_current NUMERIC DEFAULT 0;

-- =====================
-- EXPENSES: Add task_id foreign key for task-linked expenses
-- =====================
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_task_id ON public.expenses(task_id);
