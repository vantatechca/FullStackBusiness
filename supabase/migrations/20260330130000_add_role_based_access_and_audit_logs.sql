-- =============================================
-- Role-based access: add super_admin role
-- =============================================

-- No enum constraint to change — role is just a text column.
-- Update the first admin to super_admin (optional — can be done manually).

-- =============================================
-- Audit Logs table for super admin
-- =============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email text NOT NULL DEFAULT '',
  action text NOT NULL,              -- 'login' | 'login_failed' | 'create' | 'update' | 'delete'
  entity_type text NOT NULL DEFAULT '',  -- 'expense' | 'asset' | 'task' | 'revenue' | 'user' | 'department' etc.
  entity_id text DEFAULT '',
  details jsonb DEFAULT '{}',
  ip_address text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- RLS: only super_admin can read audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs select super_admin"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'super_admin');

-- Any authenticated user can insert (the app logs actions on their behalf)
CREATE POLICY "Audit logs insert"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update helper function to recognize super_admin
CREATE OR REPLACE FUNCTION public.can_access_department(dept_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    CASE
      WHEN public.get_user_role() IN ('admin', 'super_admin') THEN true
      WHEN dept_id = 'dashboard' THEN true
      ELSE dept_id = ANY(
        string_to_array(
          (SELECT COALESCE(tm.departments, '')
           FROM public.team_members tm
           WHERE tm.email = (SELECT email FROM public.profiles WHERE id = auth.uid())),
          ','
        )
      )
    END;
$$;
