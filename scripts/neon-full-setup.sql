/*
  # Business Hub - Tables and Seed Data

  1. New Tables
    - `profiles` - User profiles linked to auth.users (id, email, full_name, role, created_at)
    - `departments` - 17 business departments (id, name, icon, type, sort_order)
    - `revenue` - Revenue entries per department
    - `expenses` - Expense entries per department
    - `tasks` - Task entries per department
    - `department_notes` - Free-form notes per department
    - `gmb_listings` - Google My Business listings
    - `influencers` - Influencer and promo records
    - `suppliers` - Supplier and COGS records
    - `team_members` - Team members with dept assignments
    - `exchange_rates` - Cached exchange rate data

  2. Seed Data
    - 17 departments pre-seeded in exact sidebar order

  3. Triggers
    - Auto-create profile row on new auth.users signup
*/

-- =====================
-- PROFILES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'member',
  password_hash text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- =====================
-- DEPARTMENTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.departments (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'standard',
  sort_order integer NOT NULL DEFAULT 0
);

-- =====================
-- REVENUE TABLE
-- =====================
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

-- =====================
-- EXPENSES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id text NOT NULL REFERENCES public.departments(id),
  date text DEFAULT '',
  description text DEFAULT '',
  category text DEFAULT '',
  amount numeric DEFAULT 0,
  currency text DEFAULT 'USD',
  paid_by text DEFAULT '',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- =====================
-- TASKS TABLE
-- =====================
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

-- =====================
-- DEPARTMENT NOTES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.department_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id text UNIQUE NOT NULL REFERENCES public.departments(id),
  content text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- =====================
-- GMB LISTINGS TABLE
-- =====================
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

-- =====================
-- INFLUENCERS TABLE
-- =====================
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

-- =====================
-- SUPPLIERS TABLE
-- =====================
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

-- =====================
-- TEAM MEMBERS TABLE
-- =====================
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

-- =====================
-- EXCHANGE RATES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id integer PRIMARY KEY DEFAULT 1,
  base_currency text DEFAULT 'USD',
  rates jsonb DEFAULT '{}',
  last_updated timestamptz DEFAULT now()
);

-- =====================
-- AUTO-CREATE PROFILE TRIGGER
-- =====================
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'member'
  );
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (

-- =====================
-- SEED DEPARTMENTS
-- =====================
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

-- =====================
-- ENABLE REALTIME
-- =====================
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
-- Make expenses.department_id optional (nullable) so expenses can be "global"
ALTER TABLE public.expenses ALTER COLUMN department_id DROP NOT NULL;

-- Add optional department_id to assets table
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS department_id text REFERENCES public.departments(id);
CREATE INDEX IF NOT EXISTS idx_assets_department_id ON public.assets(department_id);
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

-- =============================================
-- Ensure admin department exists
-- =============================================
INSERT INTO public.departments (id, name, icon, type, sort_order)
VALUES ('admin', 'Admin Panel', 'ShieldCheck', 'admin', 105)
ON CONFLICT (id) DO NOTHING;
-- ============================================================================
-- Birthday Notifications Feature
-- Business partners with birthdays, starred admins, and dismissal tracking
-- ============================================================================

-- Business Partners table
CREATE TABLE IF NOT EXISTS public.business_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  birthday DATE,
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Starred admins: super_admin can star admins to receive birthday notifications
CREATE TABLE IF NOT EXISTS public.birthday_starred_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  starred_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(admin_id)
);

-- Birthday dismissals: track "already greeted" and "remind me later"
CREATE TABLE IF NOT EXISTS public.birthday_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.business_partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('greeted', 'snoozed')),
  year INT NOT NULL,
  snoozed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, user_id, year, action)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_partners_birthday ON public.business_partners(birthday);
CREATE INDEX IF NOT EXISTS idx_birthday_dismissals_partner ON public.birthday_dismissals(partner_id, user_id, year);
CREATE INDEX IF NOT EXISTS idx_birthday_starred_admins_admin ON public.birthday_starred_admins(admin_id);

-- Seed the 9 business partners (birthdays to be filled in later)
INSERT INTO public.business_partners (name) VALUES
  ('Dana'),
  ('Nik'),
  ('Fernanda'),
  ('Gauthier'),
  ('Duarte'),
  ('Aga'),
  ('Marko'),
  ('Dawid'),
  ('Laurent Jeep')
ON CONFLICT DO NOTHING;
-- ============================================================================
-- V2 Phase 1A: Document missing tables that exist in Neon but had no migration
-- This migration uses IF NOT EXISTS so it's safe to run on existing databases
-- ============================================================================

-- =====================
-- ASSETS TABLE (existed in Neon, never had a migration)
-- =====================
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

-- =====================
-- ASSET DAILY LOGS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.asset_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(asset_id, date)
);

CREATE INDEX IF NOT EXISTS idx_asset_daily_logs_asset_id ON public.asset_daily_logs(asset_id);

-- =====================
-- ASSET CATEGORY NOTES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.asset_category_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT UNIQUE NOT NULL,
  notes TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- GOALS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'custom'
    CHECK (type IN ('revenue', 'expense', 'task', 'custom')),
  target_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  department_id TEXT REFERENCES public.departments(id),
  period TEXT DEFAULT 'monthly'
    CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  status TEXT DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'missed')),
  notes TEXT DEFAULT '',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_department_id ON public.goals(department_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);

-- =====================
-- DEPARTMENT ROLES TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.department_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id TEXT NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL DEFAULT '',
  headcount INTEGER DEFAULT 0,
  daily_output TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_department_roles_dept ON public.department_roles(department_id);
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
-- ============================================================================
-- V2 Phase 1C: Extend profiles, departments, add lead role
-- ============================================================================

-- =====================
-- PROFILES: Add V2 fields
-- =====================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Toronto';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_checkin_at TIMESTAMPTZ;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

-- =====================
-- DEPARTMENTS: Add priority and display fields
-- =====================
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 50;

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- =====================
-- SEED PRIORITY SCORES (from V2 spec Section 5.2)
-- Map existing V1 departments to priority scores
-- =====================
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

-- =====================
-- UPDATE ROLE HELPERS for 5-role system
-- lead role sits between manager and member
-- Hierarchy: super_admin > admin > manager > lead > member
-- =====================

-- Update the RLS helper function to support lead role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
$$;

-- Helper: is the user lead or above?
CREATE OR REPLACE FUNCTION public.is_lead_or_above(user_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT user_role IN ('lead', 'manager', 'admin', 'super_admin')
$$;
-- ============================================================================
-- V2 Phase 1D: Core V2 tables
-- daily_checkins, metric_updates, metric_assignments,
-- notifications, daily_prompts, api_integrations
-- ============================================================================

-- =====================
-- METRIC ASSIGNMENTS
-- Links team members to specific assets/metrics they are responsible for
-- =====================
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

-- =====================
-- DAILY CHECK-INS
-- The heart of the accountability system
-- =====================
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

-- =====================
-- METRIC UPDATES
-- Audit trail for every metric/asset value change
-- =====================
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

-- =====================
-- NOTIFICATIONS
-- Persistent in-app notifications with bell icon
-- =====================
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

-- =====================
-- DAILY PROMPTS
-- Configurable check-in prompts, context-aware per department/metric
-- =====================
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

-- =====================
-- API INTEGRATIONS
-- Registry of connected external tools (metadata only, no credentials)
-- =====================
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

-- =====================
-- LOGIN MESSAGES
-- Targeted messages from admin/leaders shown on login
-- =====================
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

-- =====================
-- CHECKIN STREAKS (materialized for performance)
-- =====================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS checkin_streak INTEGER DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
-- ============================================================================
-- V2 Phase 1E: Seed the 42 metrics from the V2 spec Appendix A
-- These are inserted as assets (the existing metrics system)
-- Uses ON CONFLICT DO NOTHING to be safe on re-runs
-- ============================================================================

-- First, ensure we have the necessary departments for metrics
-- Add missing departments from the V2 spec that don't exist in V1
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

-- =====================
-- SEED ALL 42 METRICS AS ASSETS
-- =====================

-- Sites (4 metrics)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Sites', 'Sites connected to chat app', 156, 0, 'up_good', 'total', 1, 'Shopify Transferred Stores (Old 80stores)', 'sites'),
  ('Sites', 'Sites connected to CC payment router', 82, 0, 'up_good', 'total', 2, 'Jaxyl + Tristan + Jerome', 'sites'),
  ('Sites', 'Sites connected to crypto & e-transfer', 4, 0, 'up_good', 'total', 3, 'Jaxyl + Tristan + Jerome', 'sites'),
  ('Sites', 'Sites Ready to Sell', 0, 0, 'up_good', 'daily', 4, '', 'sites')
ON CONFLICT DO NOTHING;

-- Payments (4 metrics)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Payments', 'Stripe APIs active', 0, 0, 'up_good', 'total', 1, 'Track active vs capacity', 'payments'),
  ('Payments', 'Stripe APIs banned', 0, 0, 'down_good', 'total', 2, '', 'payments'),
  ('Payments', 'Shopify Payments active', 0, 0, 'up_good', 'total', 3, '', 'payments'),
  ('Payments', 'Shopify Payments banned', 0, 0, 'down_good', 'total', 4, '', 'payments')
ON CONFLICT DO NOTHING;

-- Orders (5 metrics)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Orders', 'Shopify orders', 0, 0, 'up_good', 'daily', 1, 'Renold+Tristan+Launce+Joshua+Jaxyl+Jerome', 'orders'),
  ('Orders', 'Stripe orders', 0, 0, 'up_good', 'daily', 2, '', 'orders'),
  ('Orders', 'Crypto orders (Nik Logic)', 0, 0, 'up_good', 'daily', 3, '', 'orders'),
  ('Orders', 'Crypto CC orders (Onramp)', 0, 0, 'up_good', 'daily', 4, '', 'orders'),
  ('Orders', 'E-transfer orders', 0, 0, 'up_good', 'daily', 5, '', 'orders')
ON CONFLICT DO NOTHING;

-- Gmail (4 metrics)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Gmail', 'Gmail accounts active', 250, 0, 'up_good', 'total', 1, 'Jerome, target: 4000', 'gmail'),
  ('Gmail', 'Gmail accounts banned', 5, 0, 'down_good', 'total', 2, '', 'gmail'),
  ('Gmail', 'Gmail accounts warming up', 150, 0, 'up_good', 'total', 3, '', 'gmail'),
  ('Gmail', 'Gmails warmed up (ready for reviews)', 120, 0, 'up_good', 'total', 4, '3 weeks warmup', 'gmail')
ON CONFLICT DO NOTHING;

-- GMB (3 metrics)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('GMB', 'Google My Business active', 0, 0, 'up_good', 'daily', 1, 'Mark + Ilce + Ohna', 'gmb'),
  ('GMB', 'Reviews per day (total GMB)', 0, 0, 'up_good', 'daily', 2, '', 'gmb'),
  ('GMB', 'Reviews shadow banned per day', 0, 0, 'down_good', 'daily', 3, '', 'gmb')
ON CONFLICT DO NOTHING;

-- GMC (7 metrics)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('GMC', 'GMC approved total', 1, 0, 'up_good', 'total', 1, 'Barcha+Renold+Launce+Joshua+Tristan+Jordan', 'gmc'),
  ('GMC', 'GMC banned total', 85, 0, 'down_good', 'total', 2, '', 'gmc'),
  ('GMC', 'GMC accounts created today', 0, 0, 'up_good', 'daily', 3, '', 'gmc'),
  ('GMC', 'GMC custom feeds created today', 0, 0, 'up_good', 'daily', 4, '', 'gmc'),
  ('GMC', 'GMC submitted today', 0, 0, 'up_good', 'daily', 5, '', 'gmc'),
  ('GMC', 'GMC approved today', 0, 0, 'up_good', 'daily', 6, '', 'gmc'),
  ('GMC', 'GMC banned today', 0, 0, 'down_good', 'daily', 7, '', 'gmc')
ON CONFLICT DO NOTHING;

-- Google Ads (5 metrics)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Google Ads', 'Google Ads accounts created today', 0, 0, 'up_good', 'daily', 1, 'Barcha+Renold+Launce+Joshua+Tristan+Jordan', 'google-ads-dept'),
  ('Google Ads', 'Google Ads connected to GMC feed today', 0, 0, 'up_good', 'daily', 2, '', 'google-ads-dept'),
  ('Google Ads', 'Performance Max campaigns created today', 0, 0, 'up_good', 'daily', 3, '', 'google-ads-dept'),
  ('Google Ads', 'Google Ads spend today (USD)', 0, 0, 'down_good', 'daily', 4, '', 'google-ads-dept'),
  ('Google Ads', 'Google Ads sales today (USD)', 0, 0, 'up_good', 'daily', 5, '', 'google-ads-dept')
ON CONFLICT DO NOTHING;

-- Blogs (1 metric)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Blogs', 'Blogs posted (all 680 Shopify, last 7 days)', 0, 0, 'up_good', 'daily', 1, 'Angelito + Tristan + Nathan', 'blogs-dept')
ON CONFLICT DO NOTHING;

-- Chat Support (1 metric)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Chat Support', 'Avg response time (minutes)', 0, 0, 'down_good', 'daily', 1, 'Valerie+Eric+Mik+Nate+Claire', 'chat-support')
ON CONFLICT DO NOTHING;

-- Restock & Suppliers (2 metrics)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Restock', 'Daily Regular Needs', 0, 0, 'up_good', 'total', 1, '', 'restock'),
  ('Restock', 'Specific urgent needs', 0, 0, 'up_good', 'total', 2, '', 'restock')
ON CONFLICT DO NOTHING;

-- Game Dev (1 metric)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Game Dev', 'Progress Details (Video or picture)', 0, 0, 'up_good', 'total', 1, '', 'game-dev')
ON CONFLICT DO NOTHING;

-- Video Editing (1 metric)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Video Editing', 'How many videos completed today', 0, 0, 'up_good', 'total', 1, '', 'video-editing')
ON CONFLICT DO NOTHING;

-- Revenue & Expenses (1 metric)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Revenue & Expenses', 'Is the data clear? What work was done?', 0, 0, 'up_good', 'total', 1, '', 'rev-exp')
ON CONFLICT DO NOTHING;

-- Web Dev Clients (3 metrics)
INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id) VALUES
  ('Web Dev', 'Ismael Fitness', 0, 0, 'up_good', 'total', 1, '', 'web-dev'),
  ('Web Dev', 'RD Exterminateur', 0, 0, 'up_good', 'total', 2, '', 'web-dev'),
  ('Web Dev', 'Sam Selling Cars', 0, 0, 'up_good', 'total', 3, '', 'web-dev')
ON CONFLICT DO NOTHING;

-- =====================
-- SEED DEFAULT DAILY PROMPTS
-- =====================
INSERT INTO public.daily_prompts (prompt_text, prompt_type, is_active) VALUES
  ('What did you accomplish today? Include specific numbers where possible.', 'universal', true),
  ('Did you encounter any blockers or issues? If so, what help do you need?', 'universal', true),
  ('Is there anything you need from your lead or another team member?', 'universal', true)
ON CONFLICT DO NOTHING;
