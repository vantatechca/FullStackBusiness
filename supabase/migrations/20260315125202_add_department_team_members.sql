/*
  # Add Department Team Members Table

  ## Summary
  Adds a new `department_team_members` table that stores per-department team assignments
  with rich profile data. This enables each department tab to have its own "Team" section
  showing who is in charge, their hierarchy, skills, availability, salary, bonuses, and
  project assignments.

  ## New Table: department_team_members
  - `id` - UUID primary key
  - `department_id` - text, which department tab this record belongs to
  - `name` - text, team member's name
  - `in_charge` - boolean, whether this person is the lead/manager for the department
  - `reports_to` - text, name of who they report to (within this dept context)
  - `hours_per_day` - numeric, average hours per day available
  - `days_per_week` - numeric, average days per week available
  - `main_skills` - text, comma-separated or free-text main skills
  - `tasks_love` - text, description of tasks they enjoy
  - `tasks_hate` - text, description of tasks they dislike
  - `salary` - numeric, current salary amount
  - `salary_currency` - text, currency of salary (USD, CAD, etc.)
  - `bonus_structure` - boolean, whether they participate in a bonus structure
  - `bonus_details` - text, details about their bonus structure
  - `assigned_projects` - text, comma-separated list of project/department IDs they work on
  - `notes` - text, general notes about this person in this department context
  - `sort_order` - integer, display order
  - `created_by` - uuid, references auth.users
  - `created_at` - timestamptz

  ## Security
  - RLS enabled
  - Access controlled via can_access_department() function (same pattern as other tables)
*/

CREATE TABLE IF NOT EXISTS public.department_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id text NOT NULL,
  name text NOT NULL DEFAULT '',
  in_charge boolean NOT NULL DEFAULT false,
  reports_to text NOT NULL DEFAULT '',
  hours_per_day numeric NOT NULL DEFAULT 8,
  days_per_week numeric NOT NULL DEFAULT 5,
  main_skills text NOT NULL DEFAULT '',
  tasks_love text NOT NULL DEFAULT '',
  tasks_hate text NOT NULL DEFAULT '',
  salary numeric NOT NULL DEFAULT 0,
  salary_currency text NOT NULL DEFAULT 'USD',
  bonus_structure boolean NOT NULL DEFAULT false,
  bonus_details text NOT NULL DEFAULT '',
  assigned_projects text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dept_team_members_department_id ON public.department_team_members(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_team_members_created_by ON public.department_team_members(created_by);

ALTER TABLE public.department_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dept team members select"
  ON public.department_team_members FOR SELECT
  TO authenticated
  USING (public.can_access_department(department_id));

CREATE POLICY "Dept team members insert"
  ON public.department_team_members FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Dept team members update"
  ON public.department_team_members FOR UPDATE
  TO authenticated
  USING (public.can_access_department(department_id))
  WITH CHECK (public.can_access_department(department_id));

CREATE POLICY "Dept team members delete"
  ON public.department_team_members FOR DELETE
  TO authenticated
  USING (public.can_access_department(department_id));
