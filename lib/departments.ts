import { ChartBar as BarChart3, ShoppingCart, Megaphone, Store, PenLine, Dice5, Headphones, CreditCard, MapPin, Users, Smartphone, Dna, Package, CircleUser as UserCircle, SquareCheck as CheckSquare, Wallet, TrendingUp, ShieldCheck, DollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Department } from './types';

export const DEPARTMENT_ICONS: Record<string, LucideIcon> = {
  BarChart3,
  ShoppingCart,
  Megaphone,
  Store,
  PenLine,
  Dice5,
  Headphones,
  CreditCard,
  MapPin,
  Users,
  Smartphone,
  Dna,
  Package,
  UserCircle,
  CheckSquare,
  Wallet,
  TrendingUp,
  ShieldCheck,
  DollarSign,
};

// Only system/structural pages are listed here.
// All business departments come from the database.
export const DEPARTMENTS: Department[] = [
  { id: 'dashboard',        name: 'Dashboard Overview',  icon: 'BarChart3',   type: 'overview',        sort_order: 1 },
  { id: 'assets',            name: 'Business Assets',     icon: 'BarChart3',   type: 'assets',          sort_order: 2 },
  { id: 'team-members',     name: 'Team Members',        icon: 'UserCircle',  type: 'team',            sort_order: 100 },
  { id: 'tasks-daily-goals', name: 'Tasks & Daily Goals', icon: 'CheckSquare', type: 'tasks',           sort_order: 101 },
  { id: 'revenue-global',   name: 'Revenue (Global)',    icon: 'DollarSign',  type: 'revenue-global',  sort_order: 102 },
  { id: 'expenses-global',  name: 'Expenses (Global)',   icon: 'Wallet',      type: 'expenses-global', sort_order: 103 },
  { id: 'net-profit',       name: 'Net Profit',          icon: 'TrendingUp',  type: 'net-profit',      sort_order: 104 },
  { id: 'admin',            name: 'Admin Panel',         icon: 'ShieldCheck', type: 'admin',           sort_order: 105 },
];

export function getDepartment(id: string): Department | undefined {
  return DEPARTMENTS.find(d => d.id === id);
}

export function getStandardDepartments(): Department[] {
  return DEPARTMENTS.filter(d =>
    d.type === 'standard' || d.type === 'gmb' || d.type === 'influencers' || d.type === 'restock'
  );
}
