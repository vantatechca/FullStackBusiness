-- =============================================
-- Fix profiles table for Neon compatibility
-- =============================================

-- Ensure password_hash column exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text DEFAULT '';

-- Ensure id has a default value
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Drop FK to auth.users if it exists (Neon doesn't have auth schema)
DO $$ BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey_fkey;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =============================================
-- Audit Logs table
-- =============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text NOT NULL DEFAULT '',
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT '',
  entity_id text DEFAULT '',
  details jsonb DEFAULT '{}',
  ip_address text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- No RLS on audit_logs — access is controlled at the API level
-- (Neon direct connections don't use Supabase auth, so RLS policies
--  referencing auth.uid() / get_user_role() would not work)

-- =============================================
-- Ensure admin department exists
-- =============================================
INSERT INTO public.departments (id, name, icon, type, sort_order)
VALUES ('admin', 'Admin Panel', 'ShieldCheck', 'admin', 105)
ON CONFLICT (id) DO NOTHING;
