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
  SELECT role FROM public.profiles WHERE id = (SELECT auth.uid())
$$;

-- Helper: is the user lead or above?
CREATE OR REPLACE FUNCTION public.is_lead_or_above(user_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT user_role IN ('lead', 'manager', 'admin', 'super_admin')
$$;
