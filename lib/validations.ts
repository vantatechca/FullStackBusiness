import { z } from 'zod';

export const createTaskSchema = z.object({
  department_id: z.string().nullable().optional(),
  task: z.string().min(0),
  status: z.enum(['To Do', 'In Progress', 'Done']).default('To Do'),
  assignee: z.string().optional().default(''),
  assignees: z.array(z.string()).optional().default([]),
  deadline: z.string().nullable().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  notes: z.string().optional().default(''),
  recurrence: z.enum(['One-Time', 'Daily', 'Weekly', 'Monthly']).default('One-Time'),
  goal_target: z.number().min(0).optional().default(0),
  goal_current: z.number().min(0).optional().default(0),
});

export const updateTaskSchema = z.object({
  task: z.string().optional(),
  recurrence: z.enum(['One-Time', 'Daily', 'Weekly', 'Monthly']).optional(),
  status: z.enum(['To Do', 'In Progress', 'Done']).optional(),
  assignee: z.string().optional(),
  assignees: z.array(z.string()).optional(),
  deadline: z.string().nullable().optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  notes: z.string().optional(),
  goal_target: z.number().min(0).optional(),
  goal_current: z.number().min(0).optional(),
});

export const createExpenseSchema = z.object({
  department_id: z.string().nullable().optional(),
  task_id: z.string().nullable().optional(),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(0),
  category: z.string().optional().default(''),
  amount: z.number(),
  currency: z.string().default('USD'),
  paid_by: z.string().optional().default(''),
});

export const updateExpenseSchema = z.object({
  date: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  paid_by: z.string().optional(),
  task_id: z.string().nullable().optional(),
  department_id: z.string().nullable().optional(),
});

export const createRevenueSchema = z.object({
  department_id: z.string().nullable().optional(),
  date: z.string().min(1, 'Date is required'),
  source: z.string().optional().default(''),
  amount: z.number(),
  currency: z.string().default('USD'),
  notes: z.string().optional().default(''),
});

export const updateRevenueSchema = z.object({
  date: z.string().optional(),
  source: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
});

export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['revenue', 'expense', 'task', 'custom']).default('custom'),
  target_value: z.number().min(0).default(0),
  current_value: z.number().min(0).default(0),
  currency: z.string().default('USD'),
  department_id: z.string().nullable().optional(),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly', 'custom']).default('monthly'),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  status: z.enum(['active', 'completed', 'missed']).default('active'),
  notes: z.string().optional().default(''),
});

export const createTeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  departments: z.string().optional().default(''),
  profit_pct: z.number().min(0).max(100).optional().default(0),
  status: z.enum(['Active', 'On Leave', 'Inactive']).default('Active'),
});

export const createAssetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  metric: z.string().min(1, 'Metric is required'),
  value: z.number().default(0),
  previous_value: z.number().default(0),
  direction: z.enum(['up_good', 'down_good']).default('up_good'),
  tracking: z.enum(['total', 'daily']).default('total'),
  sort_order: z.number().default(0),
  notes: z.string().optional().default(''),
  department_id: z.string().nullable().optional(),
});

export const updateAssetSchema = z.object({
  category: z.string().optional(),
  metric: z.string().optional(),
  value: z.number().optional(),
  previous_value: z.number().optional(),
  direction: z.enum(['up_good', 'down_good']).optional(),
  tracking: z.enum(['total', 'daily']).optional(),
  sort_order: z.number().optional(),
  notes: z.string().optional(),
  department_id: z.string().nullable().optional(),
});

export const createNoteSchema = z.object({
  department_id: z.string().min(1, 'Department ID is required'),
  content: z.string().min(0),
  updated_at: z.string().min(1),
});

export const updateNoteSchema = z.object({
  content: z.string(),
  updated_at: z.string(),
});

export const createProfileSchema = z.object({
  email: z.string().email('Valid email is required'),
  full_name: z.string().min(1, 'Name is required'),
  role: z.enum(['super_admin', 'admin', 'manager', 'lead', 'member']).default('member'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateProfileSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'manager', 'lead', 'member']).optional(),
  full_name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

export const createDeptTeamMemberSchema = z.object({
  department_id: z.string().min(1, 'Department ID is required'),
  name: z.string().min(1, 'Name is required'),
  in_charge: z.string().optional().default(''),
  reports_to: z.string().optional().default(''),
  hours_per_day: z.number().min(0).max(24).optional().default(0),
  days_per_week: z.number().min(0).max(7).optional().default(0),
  main_skills: z.string().optional().default(''),
  tasks_love: z.string().optional().default(''),
  tasks_hate: z.string().optional().default(''),
  salary: z.number().min(0).optional().default(0),
  salary_currency: z.string().optional().default('USD'),
  bonus_structure: z.string().optional().default(''),
  bonus_details: z.string().optional().default(''),
  assigned_projects: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  sort_order: z.number().optional().default(0),
  created_by: z.string().optional().default(''),
});
