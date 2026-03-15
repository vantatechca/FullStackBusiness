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
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'member',
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
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

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
ALTER PUBLICATION supabase_realtime ADD TABLE public.revenue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.department_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gmb_listings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.influencers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
