// ─── Roles ──────────────────────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'lead' | 'member';

// ─── Core Entities ──────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  timezone: string;
  last_checkin_at: string | null;
  is_active: boolean;
  avatar_url: string;
  checkin_streak: number;
  longest_streak: number;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  type: 'overview' | 'standard' | 'gmb' | 'influencers' | 'restock' | 'team' | 'tasks' | 'assets' | 'expenses-global' | 'revenue-global' | 'net-profit' | 'checkins' | 'birthdays' | 'admin';
  sort_order: number;
  priority_score: number;
  color: string;
  description: string;
}

export interface Revenue {
  id: string;
  department_id: string;
  date: string;
  source: string;
  amount: number;
  currency: string;
  notes: string;
  created_by: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  department_id: string | null;
  task_id: string | null;
  date: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  paid_by: string;
  created_by: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  department_id: string;
  task: string;
  recurrence: 'Daily' | 'Weekly' | 'Monthly' | 'One-Time';
  status: 'To Do' | 'In Progress' | 'Done';
  assignee: string;
  assignees: string[];
  deadline: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  notes: string;
  goal_target: number;
  goal_current: number;
  created_by: string | null;
  created_at: string;
}

export interface DepartmentNote {
  id: string;
  department_id: string;
  content: string;
  updated_at: string;
}

export interface GMBListing {
  id: string;
  name: string;
  address: string;
  status: string;
  rating: number;
  reviews: number;
  notes: string;
  created_at: string;
}

export interface Influencer {
  id: string;
  name: string;
  platform: string;
  followers: string;
  promo_code: string;
  commission_pct: number;
  revenue: number;
  contact: string;
  notes: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  product: string;
  cogs: number;
  currency: string;
  qty: number;
  contact: string;
  status: string;
  notes: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  departments: string;
  profit_pct: number;
  status: string;
  created_at: string;
}

export interface DepartmentTeamMember {
  id: string;
  department_id: string;
  name: string;
  in_charge: boolean;
  reports_to: string;
  hours_per_day: number;
  days_per_week: number;
  main_skills: string;
  tasks_love: string;
  tasks_hate: string;
  salary: number;
  salary_currency: string;
  bonus_structure: boolean;
  bonus_details: string;
  assigned_projects: string;
  notes: string;
  sort_order: number;
  created_by: string | null;
  created_at: string;
}

export interface ExchangeRates {
  id: number;
  base_currency: string;
  rates: Record<string, number>;
  last_updated: string;
}

export interface Goal {
  id: string;
  title: string;
  type: 'revenue' | 'expense' | 'task' | 'custom';
  target_value: number;
  current_value: number;
  currency: string;
  department_id: string | null;
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'missed';
  notes: string;
  created_by: string | null;
  created_at: string;
}

export type ColumnType = 'text' | 'number' | 'select' | 'multi-select' | 'date';

export interface ColumnDef {
  key: string;
  label: string;
  type: ColumnType;
  options?: string[];
  width?: string;
}

// ─── Assets / Metrics ───────────────────────────────────────────────────────

export interface Asset {
  id: string;
  category: string;
  metric: string;
  value: number;
  previous_value: number;
  direction: 'up_good' | 'down_good';
  tracking: 'total' | 'daily';
  sort_order: number;
  notes: string;
  department_id: string | null;
  updated_at: string;
  created_at: string;
}

export interface AssetDailyLog {
  id: string;
  asset_id: string;
  date: string;
  value: number;
  created_at: string;
}

// ─── V2: Check-In & Accountability ─────────────────────────────────────────

export interface MetricAssignment {
  id: string;
  asset_id: string;
  user_id: string;
  role_in_metric: 'owner' | 'contributor' | 'reviewer';
  assigned_by: string | null;
  assigned_at: string;
}

export interface DailyCheckin {
  id: string;
  user_id: string;
  checkin_date: string;
  raw_response: string;
  ai_summary: string;
  ai_extracted_metrics: any[];
  ai_confidence_score: number;
  ai_flags: any[];
  status: 'pending' | 'submitted' | 'ai_processed' | 'reviewed';
  reviewed_by: string | null;
  reviewer_notes: string;
  submitted_at: string | null;
  processed_at: string | null;
  deferred: boolean;
  created_at: string;
}

export interface MetricUpdate {
  id: string;
  asset_id: string;
  user_id: string | null;
  checkin_id: string | null;
  source: 'checkin' | 'manual' | 'api_sync';
  old_value: number | null;
  new_value: number | null;
  delta: number | null;
  api_verified: boolean;
  api_source: string;
  notes: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'checkin_reminder' | 'missed_checkin' | 'metric_alert' | 'leader_flag' | 'stalled_metric' | 'priority_change' | 'weekly_summary' | 'api_sync_error' | 'login_message' | 'system';
  title: string;
  body: string;
  is_read: boolean;
  action_url: string;
  metadata: Record<string, any>;
  expires_at: string | null;
  created_at: string;
}

export interface DailyPrompt {
  id: string;
  department_id: string | null;
  prompt_text: string;
  prompt_type: 'universal' | 'department' | 'metric_specific';
  is_active: boolean;
  created_at: string;
}

export interface ApiIntegration {
  id: string;
  name: string;
  provider: string;
  auth_type: 'api_key' | 'oauth2' | 'webhook';
  webhook_url: string;
  linked_metrics: string[];
  last_sync_at: string | null;
  sync_frequency: 'every_15min' | 'hourly' | 'daily' | 'manual';
  status: 'active' | 'error' | 'disabled';
  created_at: string;
  updated_at: string;
}

export interface LoginMessage {
  id: string;
  sender_id: string;
  target_type: 'user' | 'department' | 'role' | 'all';
  target_id: string;
  title: string;
  body: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// ─── Birthday System ────────────────────────────────────────────────────────

export interface BusinessPartner {
  id: string;
  name: string;
  birthday: string | null;
  notes: string;
  created_by: string | null;
  created_at: string;
}

export interface BirthdayStarredAdmin {
  id: string;
  admin_id: string;
  starred_by: string;
  created_at: string;
}

export interface BirthdayDismissal {
  id: string;
  partner_id: string;
  user_id: string;
  action: 'greeted' | 'snoozed';
  year: number;
  snoozed_until: string | null;
  created_at: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

export const CURRENCIES = ['USD', 'CAD', 'EUR', 'GBP', 'AED', 'AUD', 'BTC', 'USDT'] as const;

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CAD: 'CA$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  AED: 'AED',
  AUD: 'A$',
  BTC: 'BTC',
  USDT: 'USDT',
};

export const ROLE_HIERARCHY: UserRole[] = ['super_admin', 'admin', 'manager', 'lead', 'member'];

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  lead: 'Lead',
  member: 'Member',
};
