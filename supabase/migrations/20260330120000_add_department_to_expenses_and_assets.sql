-- Make expenses.department_id optional (nullable) so expenses can be "global"
ALTER TABLE public.expenses ALTER COLUMN department_id DROP NOT NULL;

-- Add optional department_id to assets table
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS department_id text REFERENCES public.departments(id);
CREATE INDEX IF NOT EXISTS idx_assets_department_id ON public.assets(department_id);
