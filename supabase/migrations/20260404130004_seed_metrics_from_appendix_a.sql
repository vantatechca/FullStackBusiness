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
