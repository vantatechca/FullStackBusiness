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

export const DEPARTMENTS: Department[] = [
  { id: 'dashboard', name: 'Dashboard Overview', icon: 'BarChart3', type: 'overview', sort_order: 1 },
  { id: 'google-merchant', name: 'Google Merchant Center', icon: 'ShoppingCart', type: 'standard', sort_order: 2 },
  { id: 'google-ads', name: 'Google Ads', icon: 'Megaphone', type: 'standard', sort_order: 3 },
  { id: 'shopify', name: 'Shopify (200 Sites)', icon: 'Store', type: 'standard', sort_order: 4 },
  { id: 'blogs', name: 'Blogs (400/mo)', icon: 'PenLine', type: 'standard', sort_order: 5 },
  { id: 'gambling-seo', name: 'Gambling SEO Blogs', icon: 'Dice5', type: 'standard', sort_order: 6 },
  { id: 'customer-service', name: 'Customer Service', icon: 'Headphones', type: 'standard', sort_order: 7 },
  { id: 'payment-router', name: 'Payment Router', icon: 'CreditCard', type: 'standard', sort_order: 8 },
  { id: 'google-my-business', name: 'Google My Business', icon: 'MapPin', type: 'gmb', sort_order: 9 },
  { id: 'influencers-promos', name: 'Influencers & Promos', icon: 'Users', type: 'influencers', sort_order: 10 },
  { id: 'intervos', name: 'Intervos (App Dev)', icon: 'Smartphone', type: 'standard', sort_order: 11 },
  { id: 'peptides-ai', name: 'Peptides AI App', icon: 'Dna', type: 'standard', sort_order: 12 },
  { id: 'restock-suppliers', name: 'Restock & Suppliers', icon: 'Package', type: 'restock', sort_order: 13 },
  { id: 'team-members', name: 'Team Members', icon: 'UserCircle', type: 'team', sort_order: 14 },
  { id: 'tasks-daily-goals', name: 'Tasks & Daily Goals', icon: 'CheckSquare', type: 'tasks', sort_order: 15 },
  { id: 'revenue-global', name: 'Revenue (Global)', icon: 'DollarSign', type: 'revenue-global', sort_order: 16 },
  { id: 'expenses-global', name: 'Expenses (Global)', icon: 'Wallet', type: 'expenses-global', sort_order: 17 },
  { id: 'net-profit', name: 'Net Profit', icon: 'TrendingUp', type: 'net-profit', sort_order: 18 },
  { id: 'admin', name: 'Admin Panel', icon: 'ShieldCheck', type: 'admin', sort_order: 19 },
];

export function getDepartment(id: string): Department | undefined {
  return DEPARTMENTS.find(d => d.id === id);
}

export function getStandardDepartments(): Department[] {
  return DEPARTMENTS.filter(d =>
    d.type === 'standard' || d.type === 'gmb' || d.type === 'influencers' || d.type === 'restock'
  );
}
