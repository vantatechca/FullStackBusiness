'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';
import { convertToUSD } from '@/lib/exchange-rates';
import SpreadsheetTable from './SpreadsheetTable';
import type { Expense, ColumnDef } from '@/lib/types';
import { CURRENCIES } from '@/lib/types';

const columns: ColumnDef[] = [
  { key: 'date',        label: 'Date',        type: 'date',   width: '120px' },
  { key: 'description', label: 'Description', type: 'text',   width: '200px' },
  { key: 'category',    label: 'Category',    type: 'text',   width: '130px' },
  { key: 'amount',      label: 'Amount',      type: 'number', width: '120px' },
  { key: 'currency',    label: 'Currency',    type: 'select', options: [...CURRENCIES], width: '100px' },
  { key: 'paid_by',     label: 'Paid By',     type: 'text',   width: '130px' },
];

const CAT_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-rose-100 text-rose-700', 'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700', 'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700',
];
const BAR_COLORS = [
  'bg-blue-400', 'bg-rose-400', 'bg-emerald-400', 'bg-amber-400',
  'bg-violet-400', 'bg-teal-400', 'bg-orange-400', 'bg-pink-400',
];

export default function GlobalExpensesView() {
  const [expenses, setExpenses] = useState<(Expense & { dept_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatDisplay, rates } = useCurrency();
  const { profile } = useAuth();

  const deptMapRef = useRef<Record<string, string>>({});

  const fetchExpenses = useCallback(async () => {
    try {
      if (Object.keys(deptMapRef.current).length === 0) {
        const dRes = await fetch('/api/table-data?table=departments');
        if (dRes.ok) { const depts = await dRes.json(); if (Array.isArray(depts)) depts.forEach((d: any) => { deptMapRef.current[d.id] = d.name; }); }
      }
      const deptMap = deptMapRef.current;
      const res = await fetch('/api/table-data?table=expenses');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setExpenses(
        (Array.isArray(data) ? data : [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((e: any) => ({
            ...e,
            dept_name: e.department_id ? (deptMap[e.department_id] || e.department_id) : 'General',
          }))
      );
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    const interval = setInterval(fetchExpenses, 30000);
    window.addEventListener('expenses-updated', fetchExpenses);
    return () => { clearInterval(interval); window.removeEventListener('expenses-updated', fetchExpenses); };
  }, [fetchExpenses]);

  const totalUSD = expenses.reduce((sum, e) => sum + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);

  // Analytics: by category
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.category?.trim() || 'Uncategorized';
      map[cat] = (map[cat] || 0) + convertToUSD(Number(e.amount) || 0, e.currency, rates);
    });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, rates]);

  // Analytics: by department
  const byDepartment = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      const dept = e.dept_name || 'General';
      map[dept] = (map[dept] || 0) + convertToUSD(Number(e.amount) || 0, e.currency, rates);
    });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses, rates]);

  const maxCatVal = Math.max(...byCategory.map(c => c.total), 1);
  const maxDeptVal = Math.max(...byDepartment.map(d => d.total), 1);

  const handleAdd = useCallback(async () => {
    const tempId = `temp-${Date.now()}`;
    const today = format(new Date(), 'yyyy-MM-dd');
    const optimistic = {
      id: tempId, department_id: '', task_id: null,
      date: today, description: '', category: '',
      amount: 0, currency: 'USD', paid_by: '',
      created_by: profile?.id ?? null, created_at: '',
      dept_name: 'General',
    } as any;
    setExpenses(prev => [optimistic, ...prev]);
    const res = await fetch('/api/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department_id: null, date: today, description: '', category: '', amount: 0, currency: 'USD', paid_by: '' }),
    });
    if (res.ok) {
      const inserted = await res.json();
      setExpenses(prev => prev.map(row => row.id === tempId ? { ...inserted, dept_name: 'General' } : row));
      toast.success('Expense added');
    } else {
      setExpenses(prev => prev.filter(row => row.id !== tempId));
      await fetchExpenses();
      toast.error('Failed to add expense');
    }
  }, [profile?.id, fetchExpenses]);

  const handleUpdate = useCallback((id: string, key: string, value: string | number | string[]) => {
    if (id.startsWith('temp-')) return;
    setExpenses(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
    fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: value }) }).catch(() => { fetchExpenses(); toast.error('Failed to update expense'); });
  }, [fetchExpenses]);

  const handleDelete = useCallback(async (id: string) => {
    setExpenses(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    toast.success('Expense deleted');
    window.dispatchEvent(new CustomEvent('expenses-updated'));
  }, []);

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Expenses</p>
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{formatDisplay(totalUSD)}</p>
          <p className="text-xs text-gray-400 mt-1">{expenses.length} entries</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
          <p className="text-2xl font-bold text-gray-900">{byCategory.length}</p>
          <p className="text-xs text-gray-400 mt-1">Top: {byCategory[0]?.name || '—'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Departments</p>
          <p className="text-2xl font-bold text-gray-900">{byDepartment.length}</p>
          <p className="text-xs text-gray-400 mt-1">Highest: {byDepartment[0]?.name || '—'}</p>
        </div>
      </div>

      {/* Breakdown: Category + Department */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* By Category */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">By Category</h3>
            </div>
            <div className="px-5 py-3 space-y-2.5 max-h-56 overflow-y-auto">
              {byCategory.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${CAT_COLORS[i % CAT_COLORS.length]}`}>{cat.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`} style={{ width: `${(cat.total / maxCatVal) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 tabular-nums shrink-0 w-20 text-right">{formatDisplay(cat.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Department */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">By Department</h3>
            </div>
            <div className="px-5 py-3 space-y-2.5 max-h-56 overflow-y-auto">
              {byDepartment.map((dept, i) => (
                <div key={dept.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 shrink-0 w-32 truncate">{dept.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-rose-400 h-full rounded-full" style={{ width: `${(dept.total / maxDeptVal) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 tabular-nums shrink-0 w-20 text-right">{formatDisplay(dept.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editable Table */}
      <SpreadsheetTable
        columns={columns}
        data={expenses}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        addLabel="Add Expense"
        loading={loading}
      />
    </div>
  );
}
