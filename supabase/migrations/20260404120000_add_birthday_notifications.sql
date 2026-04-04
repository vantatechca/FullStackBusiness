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
