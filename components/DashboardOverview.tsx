
'use client';

import { useState, useEffect } from 'react';
import { DEPARTMENT_ICONS } from '@/lib/departments';
import { useCurrency } from '@/lib/currency-context';
import { convertToUSD } from '@/lib/exchange-rates';
import type { Revenue, Expense, Task } from '@/lib/types';
import { TrendingUp, TrendingDown, CheckCircle2, BarChart3, ArrowUpRight } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const { formatDisplay, rates } = useCurrency();

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
          revRes.json(),
          expRes.json(),
          taskRes.json(),
          deptRes.json(),
        ]);
        setRevenue(revData || []);
        setExpenses(expData || []);
        setTasks(taskData || []);
        setDepartments(deptData || []);
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
  const taskRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const deptData = departments.map(d => {
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
  }).sort((a, b) => b.revenue - a.revenue);

  const maxVal = Math.max(...deptData.map(d => Math.max(d.revenue, d.expenses)), 1);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Revenue */}
        <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 overflow-hidden shadow-lg shadow-emerald-100">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 right-4 w-12 h-12 bg-white/10 rounded-full translate-y-4" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-100 text-xs font-semibold uppercase tracking-widest">Revenue</span>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp size={15} className="text-white" />
              </div>
            </div>
            <p className="text-white text-2xl font-bold tracking-tight">{formatDisplay(totalRevUSD)}</p>
            <p className="text-emerald-100 text-xs mt-1">{revenue.length} entries recorded</p>
          </div>
        </div>

        {/* Expenses */}
        <div className="relative bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-5 overflow-hidden shadow-lg shadow-rose-100">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 right-4 w-12 h-12 bg-white/10 rounded-full translate-y-4" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-rose-100 text-xs font-semibold uppercase tracking-widest">Expenses</span>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingDown size={15} className="text-white" />
              </div>
            </div>
            <p className="text-white text-2xl font-bold tracking-tight">{formatDisplay(totalExpUSD)}</p>
            <p className="text-rose-100 text-xs mt-1">{expenses.length} entries recorded</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className={`relative rounded-2xl p-5 overflow-hidden shadow-lg ${
          netProfit >= 0
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-100'
            : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-100'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 right-4 w-12 h-12 bg-white/10 rounded-full translate-y-4" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-100 text-xs font-semibold uppercase tracking-widest">Net Profit</span>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <BarChart3 size={15} className="text-white" />
              </div>
            </div>
            <p className="text-white text-2xl font-bold tracking-tight">{formatDisplay(netProfit)}</p>
            <p className="text-blue-100 text-xs mt-1">
              {margin >= 0 ? '+' : ''}{margin.toFixed(1)}% margin
            </p>
          </div>
        </div>

        {/* Tasks */}
        <div className="relative bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 overflow-hidden shadow-lg shadow-violet-100">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 right-4 w-12 h-12 bg-white/10 rounded-full translate-y-4" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-violet-100 text-xs font-semibold uppercase tracking-widest">Tasks</span>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle2 size={15} className="text-white" />
              </div>
            </div>
            <p className="text-white text-2xl font-bold tracking-tight">
              {doneTasks}<span className="text-violet-200 text-lg font-medium"> / {totalTasks}</span>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-white/20 rounded-full h-1.5">
                <div className="bg-white h-full rounded-full transition-all duration-700" style={{ width: `${taskRate}%` }} />
              </div>
              <span className="text-violet-100 text-xs">{taskRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="w-2 h-8 bg-emerald-400 rounded-full" />
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Completed</p>
            <p className="text-lg font-bold text-gray-900">{doneTasks}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="w-2 h-8 bg-amber-400 rounded-full" />
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">In Progress</p>
            <p className="text-lg font-bold text-gray-900">{inProgressTasks}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
          <div className="w-2 h-8 bg-blue-400 rounded-full" />
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold">Departments</p>
            <p className="text-lg font-bold text-gray-900">{departments.length}</p>
          </div>
        </div>
      </div>

      {/* Department Performance */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Department Performance</h3>
            <p className="text-xs text-gray-400 mt-0.5">Revenue vs expenses by department</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />Expenses
            </span>
          </div>
        </div>

        {deptData.length === 0 ? (
          <div className="py-16 text-center">
            <BarChart3 size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">No departments found. Add departments to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {deptData.map((d, i) => {
              const Icon = DEPARTMENT_ICONS[d.icon];
              const revPct = maxVal > 0 ? (d.revenue / maxVal) * 100 : 0;
              const expPct = maxVal > 0 ? (d.expenses / maxVal) * 100 : 0;
              const taskPct = d.tasks > 0 ? Math.round((d.done / d.tasks) * 100) : 0;
              const isProfit = d.net >= 0;

              return (
                <div
                  key={d.id}
                  className="px-6 py-4 hover:bg-gray-50/60 transition-colors"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start gap-4">

                    {/* Department icon + name — min width so long names wrap, never truncate */}
                    <div className="flex items-start gap-2.5 shrink-0" style={{ width: '200px' }}>
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                        {Icon && <Icon size={15} className="text-gray-500" />}
                      </div>
                      <span className="text-sm font-medium text-gray-700 break-words whitespace-normal leading-snug min-w-0 flex-1">
                        {d.name}
                      </span>
                    </div>

                    {/* Bar charts */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-emerald-400 h-full rounded-full transition-all duration-700"
                            style={{ width: `${revPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 w-20 text-right tabular-nums">
                          {formatDisplay(d.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-rose-400 h-full rounded-full transition-all duration-700"
                            style={{ width: `${expPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-rose-500 w-20 text-right tabular-nums">
                          {formatDisplay(d.expenses)}
                        </span>
                      </div>
                    </div>

                    {/* Net profit badge */}
                    <div className="w-24 shrink-0 text-right pt-0.5">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        isProfit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                      }`}>
                        <ArrowUpRight size={10} className={isProfit ? '' : 'rotate-90'} />
                        {formatDisplay(Math.abs(d.net))}
                      </div>
                    </div>

                    {/* Task progress */}
                    <div className="w-24 shrink-0 pt-1">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-violet-400 h-full rounded-full transition-all duration-700"
                            style={{ width: `${taskPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-400 tabular-nums">{d.done}/{d.tasks}</span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}