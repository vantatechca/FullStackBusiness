
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DEPARTMENT_ICONS } from '@/lib/departments';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';
import { convertToUSD } from '@/lib/exchange-rates';
import type { Revenue, Expense, Task, Goal } from '@/lib/types';
import {
  TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight,
  Plus, CheckSquare, Wallet, Users, CheckCircle2, Clock, Circle,
  Activity, DollarSign, Target, AlertTriangle,
} from 'lucide-react';
import QuickAddModal from './QuickAddModal';

interface Department {
  id: string;
  name: string;
  icon: string;
}

export default function DashboardOverview() {
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'task' | 'expense' | 'member'>('task');
  const { formatDisplay, rates } = useCurrency();
  const { profile } = useAuth();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [revRes, expRes, taskRes, deptRes] = await Promise.all([
          fetch('/api/table-data?table=revenue'),
          fetch('/api/table-data?table=expenses'),
          fetch('/api/table-data?table=tasks'),
          fetch('/api/table-data?table=departments'),
        ]);
        const [revData, expData, taskData, deptData] = await Promise.all([
          revRes.json(), expRes.json(), taskRes.json(), deptRes.json(),
        ]);
        setRevenue(Array.isArray(revData) ? revData : []);
        setExpenses(Array.isArray(expData) ? expData : []);
        setTasks(Array.isArray(taskData) ? taskData : []);
        setDepartments(Array.isArray(deptData) ? deptData : []);

        // Goals fetch is separate — table may not exist yet
        try {
          const goalsRes = await fetch('/api/goals');
          if (goalsRes.ok) {
            const goalsData = await goalsRes.json();
            setGoals(Array.isArray(goalsData) ? goalsData : []);
          }
        } catch { /* goals table may not exist yet */ }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalRevUSD = revenue.reduce((s, r) => s + convertToUSD(Number(r.amount) || 0, r.currency, rates), 0);
  const totalExpUSD = expenses.reduce((s, e) => s + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);
  const netProfit = totalRevUSD - totalExpUSD;
  const margin = totalRevUSD > 0 ? (netProfit / totalRevUSD) * 100 : 0;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const todoTasks = tasks.filter(t => t.status === 'To Do').length;
  const taskRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const deptData = useMemo(() => departments.map(d => {
    const deptRev = revenue
      .filter(r => r.department_id === d.id)
      .reduce((s, r) => s + convertToUSD(Number(r.amount) || 0, r.currency, rates), 0);
    const deptExp = expenses
      .filter(e => e.department_id === d.id)
      .reduce((s, e) => s + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);
    const deptTasks = tasks.filter(t => t.department_id === d.id);
    const deptDone = deptTasks.filter(t => t.status === 'Done').length;
    const net = deptRev - deptExp;
    return { ...d, revenue: deptRev, expenses: deptExp, net, tasks: deptTasks.length, done: deptDone };
  }).sort((a, b) => b.revenue - a.revenue), [departments, revenue, expenses, tasks, rates]);

  // Recent activity: last 8 items (tasks + expenses) sorted by created_at
  const recentActivity = useMemo(() => {
    const items: { id: string; type: 'task' | 'expense'; label: string; detail: string; time: string; status?: string }[] = [];
    tasks.slice(0, 20).forEach(t => {
      items.push({
        id: t.id, type: 'task', label: t.task || 'Untitled task',
        detail: t.department_id || 'General',
        time: t.created_at, status: t.status,
      });
    });
    expenses.slice(0, 20).forEach(e => {
      items.push({
        id: e.id, type: 'expense', label: e.description || 'Untitled expense',
        detail: `${formatDisplay(convertToUSD(Number(e.amount) || 0, e.currency, rates))}`,
        time: e.created_at,
      });
    });
    return items
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);
  }, [tasks, expenses, rates, formatDisplay]);

  // Active goals with percentage from stored values
  const activeGoals = useMemo(() => {
    return goals.filter(g => g.status === 'active').map(goal => {
      const current = Number(goal.current_value) || 0;
      const pct = goal.target_value > 0 ? Math.min(Math.round((current / goal.target_value) * 100), 100) : 0;
      return { ...goal, current_value: current, pct };
    }).slice(0, 4);
  }, [goals]);

  // Stagnant task alerts: tasks with a goal_target > 0 but goal_current is 0 or < 25%
  const stagnantTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const target = Number((t as any).goal_target) || 0;
        const current = Number((t as any).goal_current) || 0;
        if (target <= 0) return false;
        const pct = Math.round((current / target) * 100);
        return pct < 25 && t.status !== 'Done';
      })
      .map(t => {
        const target = Number((t as any).goal_target) || 0;
        const current = Number((t as any).goal_current) || 0;
        const pct = target > 0 ? Math.round((current / target) * 100) : 0;
        const assignees = Array.isArray((t as any).assignees)
          ? (t as any).assignees
          : typeof (t as any).assignee === 'string' && (t as any).assignee
            ? [(t as any).assignee]
            : [];
        return { ...t, pct, assignees, goal_target: target, goal_current: current };
      })
      .slice(0, 5);
  }, [tasks]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] || '';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[104px] bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-80 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header: Greeting + Quick Actions ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Here&apos;s what&apos;s happening across your business</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { type: 'task' as const,    label: 'Task',    icon: <CheckSquare size={14} /> },
            { type: 'expense' as const, label: 'Expense', icon: <Wallet size={14} /> },
            { type: 'member' as const,  label: 'Member',  icon: <Users size={14} /> },
          ].map(a => (
            <button
              key={a.type}
              onClick={() => { setQuickAddType(a.type); setQuickAddOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-[#3b82f6] hover:text-[#3b82f6] transition-all"
            >
              <Plus size={12} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Revenue */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue</span>
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatDisplay(totalRevUSD)}</p>
          <p className="text-xs text-gray-400 mt-1.5">{revenue.length} entries recorded</p>
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expenses</span>
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
              <TrendingDown size={16} className="text-rose-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatDisplay(totalExpUSD)}</p>
          <p className="text-xs text-gray-400 mt-1.5">{expenses.length} entries recorded</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Net Profit</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <DollarSign size={16} className={netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{formatDisplay(netProfit)}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {margin >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(margin).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">margin</span>
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tasks</span>
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={16} className="text-violet-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {doneTasks}<span className="text-gray-300 text-lg font-medium"> / {totalTasks}</span>
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div className="bg-violet-500 h-full rounded-full transition-all duration-700" style={{ width: `${taskRate}%` }} />
            </div>
            <span className="text-xs font-semibold text-gray-500">{taskRate}%</span>
          </div>
        </div>
      </div>

      {/* ── Task Status Summary ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
            <Circle size={14} className="text-red-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 leading-none">{todoTasks}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">To Do</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
            <Clock size={14} className="text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 leading-none">{inProgressTasks}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">In Progress</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3.5 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <CheckCircle2 size={14} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 leading-none">{doneTasks}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Completed</p>
          </div>
        </div>
      </div>

      {/* ── Active Goals Progress ── */}
      {activeGoals.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[#3b82f6]" />
              <h3 className="font-semibold text-gray-900 text-sm">Active Goals</h3>
            </div>
            <a href="/dashboard/goals" className="text-xs text-[#3b82f6] hover:underline font-medium">View all</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100">
            {activeGoals.map(goal => {
              const pctColor = goal.pct >= 100 ? 'bg-emerald-500' : goal.pct >= 50 ? 'bg-blue-500' : goal.pct >= 25 ? 'bg-amber-500' : 'bg-gray-300';
              return (
                <div key={goal.id} className="bg-white px-5 py-4">
                  <p className="text-sm font-medium text-gray-700 truncate mb-1">{goal.title}</p>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900 tabular-nums">
                      {goal.current_value.toLocaleString()}
                    </span>
                    <span className={`text-sm font-bold tabular-nums ${goal.pct >= 100 ? 'text-emerald-600' : goal.pct >= 50 ? 'text-blue-600' : 'text-gray-400'}`}>
                      {goal.pct}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${pctColor}`} style={{ width: `${goal.pct}%` }} />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">
                    Target: {goal.target_value.toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Stagnant Tasks Alert ── */}
      {stagnantTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-red-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="font-semibold text-red-800 text-sm">Needs Attention</h3>
            <span className="text-xs text-red-500 font-medium ml-1">
              {stagnantTasks.length} task{stagnantTasks.length > 1 ? 's' : ''} behind on goals
            </span>
          </div>
          <div className="divide-y divide-red-100">
            {stagnantTasks.map(t => {
              const pctColor = t.pct === 0 ? 'bg-red-400' : 'bg-amber-400';
              return (
                <div key={t.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-900 truncate">{t.task || 'Untitled task'}</p>
                    <p className="text-xs text-red-500 mt-0.5">
                      {t.goal_current}/{t.goal_target} completed ({t.pct}%)
                      {t.assignees.length > 0 && (
                        <span className="ml-2">
                          — Assigned to: <strong>{t.assignees.join(', ')}</strong>
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="w-20 shrink-0">
                    <div className="bg-red-200 rounded-full h-2 overflow-hidden">
                      <div className={`h-full rounded-full ${pctColor}`} style={{ width: `${t.pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600 w-10 text-right tabular-nums">{t.pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Main Content: Department Performance + Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Department Performance — 2/3 width */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Department Performance</h3>
            <p className="text-xs text-gray-400 mt-0.5">Revenue, expenses and tasks by department</p>
          </div>

          {deptData.length === 0 ? (
            <div className="py-16 text-center">
              <BarChart3 size={28} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">No departments yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Department</th>
                    <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Revenue</th>
                    <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Expenses</th>
                    <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Profit</th>
                    <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {deptData.map((d, i) => {
                    const Icon = DEPARTMENT_ICONS[d.icon];
                    const isProfit = d.net >= 0;
                    const taskPct = d.tasks > 0 ? Math.round((d.done / d.tasks) * 100) : 0;

                    return (
                      <tr key={d.id} className={`border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-5 py-3.5">
                          <Link href={`/dashboard/${d.id}`} className="flex items-center gap-2.5 group">
                            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                              {Icon && <Icon size={13} className="text-gray-500 group-hover:text-blue-500 transition-colors" />}
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors break-words whitespace-normal leading-snug">
                              {d.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-sm font-semibold text-gray-900 tabular-nums">{formatDisplay(d.revenue)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-sm text-gray-500 tabular-nums">{formatDisplay(d.expenses)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isProfit ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'
                          }`}>
                            {isProfit ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                            {formatDisplay(Math.abs(d.net))}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-violet-400 h-full rounded-full transition-all duration-700" style={{ width: `${taskPct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 tabular-nums w-10 text-right">{d.done}/{d.tasks}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity — 1/3 width */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Activity</h3>
            <p className="text-xs text-gray-400 mt-0.5">Latest tasks and expenses</p>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <Activity size={24} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No recent activity</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {recentActivity.map((item, i) => (
                <div key={`${item.type}-${item.id}`} className={`px-5 py-3.5 flex items-start gap-3 ${i < recentActivity.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50/60 transition-colors`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === 'task' ? 'bg-violet-50' : 'bg-rose-50'
                  }`}>
                    {item.type === 'task'
                      ? item.status === 'Done'
                        ? <CheckCircle2 size={13} className="text-emerald-500" />
                        : item.status === 'In Progress'
                          ? <Clock size={13} className="text-amber-500" />
                          : <Circle size={13} className="text-violet-400" />
                      : <Wallet size={13} className="text-rose-400" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 font-medium leading-snug truncate">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.detail}</p>
                  </div>
                  {item.type === 'task' && item.status && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                      item.status === 'Done' ? 'bg-emerald-50 text-emerald-600' :
                      item.status === 'In Progress' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {item.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} entityType={quickAddType} />
    </div>
  );
}
