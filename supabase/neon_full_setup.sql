-- ============================================================================
-- NEON FULL SETUP: Single file to run all migrations on a fresh Neon database
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT DO NOTHING throughout
-- Skips: RLS policies (Neon doesn't use Supabase auth), realtime, auth triggers
-- Already run: birthday notifications (#9), document missing tables (#10)
-- ============================================================================

-- ============================================================================
-- PART 1: Base tables (from migration #1, adapted for Neon - no auth.users FK)
-- ============================================================================

-- PROFILES (no FK to auth.users for Neon compatibility)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now()
);

-- DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.departments (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'standard',
  sort_order integer NOT NULL DEFAULT 0
);

-- REVENUE
CREATE TABLE IF NOT EXISTS public.revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id text NOT NULL REFERENCES public.departments(id),
  date text DEFAULT '',
  source text DEFAULT '',
  amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  notes text DEFAULT '',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id text REFERENCES public.departments(id),
  date text DEFAULT '',
  description text DEFAULT '',
  category text DEFAULT '',
  amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  paid_by text DEFAULT '',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id text NOT NULL REFERENCES public.departments(id),
  task text DEFAULT '',
  status text DEFAULT 'To Do',
  assignee text DEFAULT '',
  deadline text DEFAULT '',
  priority text DEFAULT 'Medium',
  notes text DEFAULT '',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- DEPARTMENT NOTES
CREATE TABLE IF NOT EXISTS public.department_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id text UNIQUE NOT NULL REFERENCES public.departments(id),
  content text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- GMB LISTINGS
CREATE TABLE IF NOT EXISTS public.gmb_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text DEFAULT '',
  address text DEFAULT '',
  status text DEFAULT 'Pending',
  rating numeric DEFAULT 0,
  reviews integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- INFLUENCERS
CREATE TABLE IF NOT EXISTS public.influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text DEFAULT '',
  platform text DEFAULT 'Instagram',
  followers text DEFAULT '',
  promo_code text DEFAULT '',
  commission_pct numeric DEFAULT 0,
  revenue numeric DEFAULT 0,
  contact text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text DEFAULT '',
  product text DEFAULT '',
  cogs numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  qty integer DEFAULT 0,
  contact text DEFAULT '',
  status text DEFAULT 'Pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- TEAM MEMBERS
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text DEFAULT '',
  role text DEFAULT '',
  email text DEFAULT '',
  departments text DEFAULT '',
  profit_pct numeric DEFAULT 0,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);

-- EXCHANGE RATES
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id integer PRIMARY KEY DEFAULT 1,
  base_currency text DEFAULT 'USD',
  rates jsonb DEFAULT '{}',
  last_updated timestamptz DEFAULT now()
);

-- SEED 17 DEPARTMENTS
INSERT INTO public.departments (id, name, icon, type, sort_order) VALUES
  ('dashboard', 'Dashboard Overview', 'BarChart3', 'overview', 1),
  ('google-merchant', 'Google Merchant Center', 'ShoppingCart', 'standard', 2),
  ('google-ads', 'Google Ads', 'Megaphone', 'standard', 3),
  ('shopify', 'Shopify (200 Sites)', 'Store', 'standard', 4),
  ('blogs', 'Blogs (400/mo)', 'PenLine', 'standard', 5),
  ('gambling-seo', 'Gambling SEO Blogs', 'Dice5', 'standard', 6),
  ('customer-service', 'Customer Service', 'Headphones', 'standard', 7),
  ('payment-router', 'Payment Router', 'CreditCard', 'standard', 8),
  ('google-my-business', 'Google My Business', 'MapPin', 'gmb', 9),
  ('influencers-promos', 'Influencers & Promos', 'Users', 'influencers', 10),
  ('intervos', 'Intervos (App Dev)', 'Smartphone', 'standard', 11),
  ('peptides-ai', 'Peptides AI App', 'Dna', 'standard', 12),
  ('restock-suppliers', 'Restock & Suppliers', 'Package', 'restock', 13),
  ('team-members', 'Team Members', 'UserCircle', 'team', 14),
  ('tasks-daily-goals', 'Tasks & Daily Goals', 'CheckSquare', 'tasks', 15),
  ('expenses-global', 'Expenses (Global)', 'Wallet', 'expenses-global', 16),
  ('net-profit', 'Net Profit', 'TrendingUp', 'net-profit', 17)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 2: Department team members (from migration #5, no auth.users FK)
-- ============================================================================

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
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dept_team_members_department_id ON public.department_team_members(department_id);
CREATE INDEX IF NOT EXISTS idx_dept_team_members_created_by ON public.department_team_members(created_by);

-- ============================================================================
-- PART 3: Task recurrence (from migration #6)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'recurrence'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN recurrence text NOT NULL DEFAULT 'One-Time';
  END IF;
END $$;

-- ============================================================================
-- PART 4: Make expenses.department_id nullable (from migration #7)
-- ============================================================================

ALTER TABLE public.expenses ALTER COLUMN department_id DROP NOT NULL;

-- ============================================================================
-- PART 5: Neon compatibility + audit logs (from migration #8)
-- ============================================================================

-- Add password_hash for Neon auth
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash text DEFAULT '';

-- Ensure profiles.id has a default
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Drop FK to auth.users if it exists (Neon doesn't have auth schema)
DO $$ BEGIN
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey_fkey;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- AUDIT LOGS
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

-- Admin department
INSERT INTO public.departments (id, name, icon, type, sort_order)
VALUES ('admin', 'Admin Panel', 'ShieldCheck', 'admin', 105)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 6: Base table indexes (from migration #4)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_department_id ON public.expenses(department_id);
CREATE INDEX IF NOT EXISTS idx_revenue_created_by ON public.revenue(created_by);
CREATE INDEX IF NOT EXISTS idx_revenue_department_id ON public.revenue(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_department_id ON public.tasks(department_id);

-- ============================================================================
-- PART 7: V2 Phase 1B - Fix task and expense schema (migration #11)
-- ============================================================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS assignees JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS goal_target NUMERIC DEFAULT 0;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS goal_current NUMERIC DEFAULT 0;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_task_id ON public.expenses(task_id);

-- ============================================================================
-- PART 8: V2 Phase 1C - Extend profiles & departments (migration #12)
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Toronto';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_checkin_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 50;

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Seed priority scores
UPDATE public.departments SET priority_score = 95, color = '#ef4444', description = 'Core asset. Everything depends on live, functional stores.'
  WHERE id = 'shopify';
UPDATE public.departments SET priority_score = 92, color = '#ef4444', description = 'No payments = no revenue. Stripe/Shopify bans are critical.'
  WHERE id = 'payment-router';
UPDATE public.departments SET priority_score = 85, color = '#ef4444', description = 'Gates Google Ads. Banned accounts are an urgent problem.'
  WHERE id = 'google-merchant';
UPDATE public.departments SET priority_score = 82, color = '#ef4444', description = 'Revenue driver. Depends on GMC.'
  WHERE id = 'google-ads';
UPDATE public.departments SET priority_score = 75, color = '#f97316', description = 'Needed for reviews and accounts.'
  WHERE id = 'gambling-seo';
UPDATE public.departments SET priority_score = 70, color = '#f97316', description = 'Social proof. Shadow bans need monitoring.'
  WHERE id = 'google-my-business';
UPDATE public.departments SET priority_score = 60, color = '#f97316', description = 'SEO/content. Significant volume.'
  WHERE id = 'blogs';
UPDATE public.departments SET priority_score = 55, color = '#f97316', description = 'Customer experience. Response time matters.'
  WHERE id = 'customer-service';
UPDATE public.departments SET priority_score = 50, color = '#3b82f6', description = 'Supply chain. Intermittent urgency.'
  WHERE id = 'restock-suppliers';
UPDATE public.departments SET priority_score = 45, color = '#3b82f6', description = 'Financial tracking.'
  WHERE id = 'expenses-global';
UPDATE public.departments SET priority_score = 40, color = '#3b82f6', description = 'Influencer and promo partner management.'
  WHERE id = 'influencers-promos';
UPDATE public.departments SET priority_score = 35, color = '#3b82f6', description = 'App development.'
  WHERE id = 'intervos';
UPDATE public.departments SET priority_score = 30, color = '#3b82f6', description = 'AI peptides application.'
  WHERE id = 'peptides-ai';

-- ============================================================================
-- PART 9: V2 Phase 1D - Core V2 tables (migration #13)
-- ============================================================================

-- ASSETS (ensure exists - was in migration #10 but needed for FKs below)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT '',
  metric TEXT NOT NULL DEFAULT '',
  value NUMERIC DEFAULT 0,
  previous_value NUMERIC DEFAULT 0,
  direction TEXT NOT NULL DEFAULT 'up_good'
    CHECK (direction IN ('up_good', 'down_good')),
  tracking TEXT NOT NULL DEFAULT 'total'
    CHECK (tracking IN ('total', 'daily')),
  sort_order INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  department_id TEXT REFERENCES public.departments(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_sort_order ON public.assets(sort_order);
CREATE INDEX IF NOT EXISTS idx_assets_department_id ON public.assets(department_id);

-- METRIC ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.metric_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_metric TEXT NOT NULL DEFAULT 'contributor'
    CHECK (role_in_metric IN ('owner', 'contributor', 'reviewer')),
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(asset_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_metric_assignments_asset ON public.metric_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_metric_assignments_user ON public.metric_assignments(user_id);

-- DAILY CHECK-INS
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  raw_response TEXT DEFAULT '',
  ai_summary TEXT DEFAULT '',
  ai_extracted_metrics JSONB DEFAULT '[]'::jsonb,
  ai_confidence_score NUMERIC DEFAULT 0,
  ai_flags JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'submitted', 'ai_processed', 'reviewed')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewer_notes TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  deferred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON public.daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON public.daily_checkins(checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_status ON public.daily_checkins(status);

-- METRIC UPDATES
CREATE TABLE IF NOT EXISTS public.metric_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  checkin_id UUID REFERENCES public.daily_checkins(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('checkin', 'manual', 'api_sync')),
  old_value NUMERIC,
  new_value NUMERIC,
  delta NUMERIC,
  api_verified BOOLEAN DEFAULT false,
  api_source TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metric_updates_asset ON public.metric_updates(asset_id);
CREATE INDEX IF NOT EXISTS idx_metric_updates_user ON public.metric_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_metric_updates_checkin ON public.metric_updates(checkin_id);
CREATE INDEX IF NOT EXISTS idx_metric_updates_created ON public.metric_updates(created_at DESC);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system'
    CHECK (type IN (
      'checkin_reminder', 'missed_checkin', 'metric_alert',
      'leader_flag', 'stalled_metric', 'priority_change',
      'weekly_summary', 'api_sync_error', 'login_message', 'system'
    )),
  title TEXT NOT NULL DEFAULT '',
  body TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- DAILY PROMPTS
CREATE TABLE IF NOT EXISTS public.daily_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id TEXT REFERENCES public.departments(id) ON DELETE SET NULL,
  prompt_text TEXT NOT NULL,
  prompt_type TEXT NOT NULL DEFAULT 'universal'
    CHECK (prompt_type IN ('universal', 'department', 'metric_specific')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_prompts_dept ON public.daily_prompts(department_id);
CREATE INDEX IF NOT EXISTS idx_daily_prompts_active ON public.daily_prompts(is_active);

-- API INTEGRATIONS
CREATE TABLE IF NOT EXISTS public.api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT '',
  auth_type TEXT DEFAULT 'api_key'
    CHECK (auth_type IN ('api_key', 'oauth2', 'webhook')),
  webhook_url TEXT DEFAULT '',
  linked_metrics JSONB DEFAULT '[]'::jsonb,
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'daily'
    CHECK (sync_frequency IN ('every_15min', 'hourly', 'daily', 'manual')),
  status TEXT DEFAULT 'disabled'
    CHECK (status IN ('active', 'error', 'disabled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- LOGIN MESSAGES
CREATE TABLE IF NOT EXISTS public.login_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  target_type TEXT NOT NULL DEFAULT 'all'
    CHECK (target_type IN ('user', 'department', 'role', 'all')),
  target_id TEXT DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_messages_active ON public.login_messages(is_active, expires_at);

-- CHECKIN STREAKS
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS checkin_streak INTEGER DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;

-- ============================================================================
-- PART 10: V2 Phase 1E - Seed metrics from Appendix A (migration #14)
-- ============================================================================

-- Add V2 departments
INSERT INTO public.departments (id, name, icon, type, sort_order, priority_score, color, description) VALUES
  ('sites', 'Sites (Shopify 600)', 'Globe', 'standard', 2, 95, '#ef4444', 'Core asset. Everything depends on live, functional stores.'),
  ('payments', 'Payments', 'CreditCard', 'standard', 3, 92, '#ef4444', 'No payments = no revenue. Stripe/Shopify bans are critical.'),
  ('orders', 'Orders', 'ShoppingBag', 'standard', 4, 90, '#ef4444', 'Direct revenue tracking. Daily flow matters.'),
  ('gmail', 'Gmail', 'Mail', 'standard', 5, 75, '#f97316', 'Needed for reviews and accounts.'),
  ('gmb', 'GMB (Reviews)', 'MapPin', 'standard', 6, 70, '#f97316', 'Social proof. Shadow bans need monitoring.'),
  ('gmc', 'Google Merchant Center', 'ShoppingCart', 'standard', 7, 85, '#ef4444', 'Gates Google Ads. Banned accounts are urgent.'),
  ('google-ads-dept', 'Google Ads', 'Megaphone', 'standard', 8, 82, '#ef4444', 'Revenue driver. Depends on GMC.'),
  ('blogs-dept', 'Blogs', 'PenLine', 'standard', 9, 60, '#f97316', 'SEO/content. 400/mo significant volume.'),
  ('chat-support', 'Chat Support', 'MessageCircle', 'standard', 10, 55, '#f97316', 'Customer experience. Response time matters.'),
  ('restock', 'Restock & Suppliers', 'Package', 'standard', 11, 50, '#3b82f6', 'Supply chain. Intermittent urgency.'),
  ('game-dev', 'Game Dev', 'Gamepad2', 'standard', 12, 20, '#3b82f6', 'Lowest operational urgency.'),
  ('video-editing', 'Video Editing', 'Video', 'standard', 13, 30, '#3b82f6', 'Support function.'),
  ('rev-exp', 'Revenue & Expenses', 'DollarSign', 'standard', 14, 45, '#3b82f6', 'Financial tracking.'),
  ('web-dev', 'Web Dev Clients', 'Code', 'standard', 15, 40, '#3b82f6', '3 active clients.')
ON CONFLICT (id) DO NOTHING;

-- SEED ALL 42 METRICS AS ASSETS
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Sites', 'Sites connected to chat app', 156, 0, 'up_good', 'total', 1, 'Shopify Transferred Stores (Old 80stores)', 'sites'),
  ('Sites', 'Sites connected to CC payment router', 82, 0, 'up_good', 'total', 2, 'Jaxyl + Tristan + Jerome', 'sites'),
  ('Sites', 'Sites connected to crypto & e-transfer', 4, 0, 'up_good', 'total', 3, 'Jaxyl + Tristan + Jerome', 'sites'),
  ('Sites', 'Sites Ready to Sell', 0, 0, 'up_good', 'daily', 4, '', 'sites'),
  ('Payments', 'Stripe APIs active', 0, 0, 'up_good', 'total', 1, 'Track active vs capacity', 'payments'),
  ('Payments', 'Stripe APIs banned', 0, 0, 'down_good', 'total', 2, '', 'payments'),
  ('Payments', 'Shopify Payments active', 0, 0, 'up_good', 'total', 3, '', 'payments'),
  ('Payments', 'Shopify Payments banned', 0, 0, 'down_good', 'total', 4, '', 'payments'),
  ('Orders', 'Shopify orders', 0, 0, 'up_good', 'daily', 1, 'Renold+Tristan+Launce+Joshua+Jaxyl+Jerome', 'orders'),
  ('Orders', 'Stripe orders', 0, 0, 'up_good', 'daily', 2, '', 'orders'),
  ('Orders', 'Crypto orders (Nik Logic)', 0, 0, 'up_good', 'daily', 3, '', 'orders'),
  ('Orders', 'Crypto CC orders (Onramp)', 0, 0, 'up_good', 'daily', 4, '', 'orders'),
  ('Orders', 'E-transfer orders', 0, 0, 'up_good', 'daily', 5, '', 'orders'),
  ('Gmail', 'Gmail accounts active', 250, 0, 'up_good', 'total', 1, 'Jerome, target: 4000', 'gmail'),
  ('Gmail', 'Gmail accounts banned', 5, 0, 'down_good', 'total', 2, '', 'gmail'),
  ('Gmail', 'Gmail accounts warming up', 150, 0, 'up_good', 'total', 3, '', 'gmail'),
  ('Gmail', 'Gmails warmed up (ready for reviews)', 120, 0, 'up_good', 'total', 4, '3 weeks warmup', 'gmail'),
  ('GMB', 'Google My Business active', 0, 0, 'up_good', 'daily', 1, 'Mark + Ilce + Ohna', 'gmb'),
  ('GMB', 'Reviews per day (total GMB)', 0, 0, 'up_good', 'daily', 2, '', 'gmb'),
  ('GMB', 'Reviews shadow banned per day', 0, 0, 'down_good', 'daily', 3, '', 'gmb'),
  ('GMC', 'GMC approved total', 1, 0, 'up_good', 'total', 1, 'Barcha+Renold+Launce+Joshua+Tristan+Jordan', 'gmc'),
  ('GMC', 'GMC banned total', 85, 0, 'down_good', 'total', 2, '', 'gmc'),
  ('GMC', 'GMC accounts created today', 0, 0, 'up_good', 'daily', 3, '', 'gmc'),
  ('GMC', 'GMC custom feeds created today', 0, 0, 'up_good', 'daily', 4, '', 'gmc'),
  ('GMC', 'GMC submitted today', 0, 0, 'up_good', 'daily', 5, '', 'gmc'),
  ('GMC', 'GMC approved today', 0, 0, 'up_good', 'daily', 6, '', 'gmc'),
  ('GMC', 'GMC banned today', 0, 0, 'down_good', 'daily', 7, '', 'gmc'),
  ('Google Ads', 'Google Ads accounts created today', 0, 0, 'up_good', 'daily', 1, 'Barcha+Renold+Launce+Joshua+Tristan+Jordan', 'google-ads-dept'),
  ('Google Ads', 'Google Ads connected to GMC feed today', 0, 0, 'up_good', 'daily', 2, '', 'google-ads-dept'),
  ('Google Ads', 'Performance Max campaigns created today', 0, 0, 'up_good', 'daily', 3, '', 'google-ads-dept'),
  ('Google Ads', 'Google Ads spend today (USD)', 0, 0, 'down_good', 'daily', 4, '', 'google-ads-dept'),
  ('Google Ads', 'Google Ads sales today (USD)', 0, 0, 'up_good', 'daily', 5, '', 'google-ads-dept'),
  ('Blogs', 'Blogs posted (all 680 Shopify, last 7 days)', 0, 0, 'up_good', 'daily', 1, 'Angelito + Tristan + Nathan', 'blogs-dept'),
  ('Chat Support', 'Avg response time (minutes)', 0, 0, 'down_good', 'daily', 1, 'Valerie+Eric+Mik+Nate+Claire', 'chat-support'),
  ('Restock', 'Daily Regular Needs', 0, 0, 'up_good', 'total', 1, '', 'restock'),
  ('Restock', 'Specific urgent needs', 0, 0, 'up_good', 'total', 2, '', 'restock'),
  ('Game Dev', 'Progress Details (Video or picture)', 0, 0, 'up_good', 'total', 1, '', 'game-dev'),
  ('Video Editing', 'How many videos completed today', 0, 0, 'up_good', 'total', 1, '', 'video-editing'),
  ('Revenue & Expenses', 'Is the data clear? What work was done?', 0, 0, 'up_good', 'total', 1, '', 'rev-exp'),
  ('Web Dev', 'Ismael Fitness', 0, 0, 'up_good', 'total', 1, '', 'web-dev'),
  ('Web Dev', 'RD Exterminateur', 0, 0, 'up_good', 'total', 2, '', 'web-dev'),
  ('Web Dev', 'Sam Selling Cars', 0, 0, 'up_good', 'total', 3, '', 'web-dev')
ON CONFLICT DO NOTHING;

-- SEED DEFAULT DAILY PROMPTS
INSERT INTO public.daily_prompts (prompt_text, prompt_type, is_active) VALUES
  ('What did you accomplish today? Include specific numbers where possible.', 'universal', true),
  ('Did you encounter any blockers or issues? If so, what help do you need?', 'universal', true),
  ('Is there anything you need from your lead or another team member?', 'universal', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DONE! All tables, indexes, and seed data are now in place.
-- ============================================================================
