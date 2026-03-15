'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getStandardDepartments, DEPARTMENT_ICONS } from '@/lib/departments';
import { useCurrency } from '@/lib/currency-context';
import { convertToUSD } from '@/lib/exchange-rates';
import type { Revenue, Expense, Task } from '@/lib/types';
import KPICard from './KPICard';

export default function DashboardOverview() {
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatDisplay, rates } = useCurrency();

  useEffect(() => {
    const fetchAll = async () => {
      const [revRes, expRes, taskRes] = await Promise.all([
        supabase.from('revenue').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('tasks').select('*'),
      ]);
      setRevenue((revRes.data as Revenue[]) || []);
      setExpenses((expRes.data as Expense[]) || []);
      setTasks((taskRes.data as Task[]) || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const totalRevUSD = revenue.reduce((s, r) => s + convertToUSD(Number(r.amount) || 0, r.currency, rates), 0);
  const totalExpUSD = expenses.reduce((s, e) => s + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);
  const netProfit = totalRevUSD - totalExpUSD;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'Done').length;

  const departments = getStandardDepartments();

  const deptData = departments.map(d => {
    const deptRev = revenue
      .filter(r => r.department_id === d.id)
      .reduce((s, r) => s + convertToUSD(Number(r.amount) || 0, r.currency, rates), 0);
    const deptExp = expenses
      .filter(e => e.department_id === d.id)
      .reduce((s, e) => s + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);
    const deptTasks = tasks.filter(t => t.department_id === d.id);
    const deptDone = deptTasks.filter(t => t.status === 'Done').length;
    return { ...d, revenue: deptRev, expenses: deptExp, tasks: deptTasks.length, done: deptDone };
  });

  const maxVal = Math.max(...deptData.map(d => Math.max(d.revenue, d.expenses)), 1);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
        {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={formatDisplay(totalRevUSD)} color="green" />
        <KPICard title="Total Expenses" value={formatDisplay(totalExpUSD)} color="red" />
        <KPICard title="Net Profit" value={formatDisplay(netProfit)} color={netProfit >= 0 ? 'green' : 'red'} />
        <KPICard title="Tasks Completed" value={`${doneTasks} / ${totalTasks}`} color="blue" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm">Department Performance</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {deptData.map(d => {
            const Icon = DEPARTMENT_ICONS[d.icon];
            const revWidth = maxVal > 0 ? (d.revenue / maxVal) * 100 : 0;
            const expWidth = maxVal > 0 ? (d.expenses / maxVal) * 100 : 0;
            return (
              <div key={d.id} className="px-5 py-3 flex items-center gap-4">
                <div className="flex items-center gap-2 w-48 shrink-0">
                  {Icon && <Icon size={16} className="text-gray-400" />}
                  <span className="text-sm text-gray-700 truncate">{d.name}</span>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-[#22c55e] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(revWidth, 0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#22c55e] font-medium w-24 text-right">
                      {formatDisplay(d.revenue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="bg-[#ef4444] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(expWidth, 0)}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#ef4444] font-medium w-24 text-right">
                      {formatDisplay(d.expenses)}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 w-16 text-right shrink-0">
                  {d.done}/{d.tasks} tasks
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
