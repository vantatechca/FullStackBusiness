-- ============================================================================
-- V2 Phase 1A: Document missing tables that exist in Neon but had no migration
-- This migration uses IF NOT EXISTS so it's safe to run on existing databases
-- ============================================================================

-- =====================
-- PREREQUISITE: PROFILES TABLE (created in base migration, included here for standalone runs)
-- =====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now()
);

-- =====================
-- PREREQUISITE: DEPARTMENTS TABLE (created in base migration, included here for standalone runs)
-- =====================
CREATE TABLE IF NOT EXISTS public.departments (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'standard',
  sort_order integer NOT NULL DEFAULT 0
);

-- Seed departments if empty (needed for foreign key references below)
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
