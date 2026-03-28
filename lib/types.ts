export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'member';
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  type: 'overview' | 'standard' | 'gmb' | 'influencers' | 'restock' | 'team' | 'tasks' | 'expenses-global' | 'revenue-global' | 'net-profit' | 'admin';
  sort_order: number;
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
  department_id: string;
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
  assignee: string;        // legacy — mirrors assignees[0], kept for DB compat
  assignees: string[];     // primary multi-assignee field
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