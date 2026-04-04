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
