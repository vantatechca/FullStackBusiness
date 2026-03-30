'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';
import { logAudit } from '@/lib/audit';
import { convertToUSD } from '@/lib/exchange-rates';
import SpreadsheetTable from './SpreadsheetTable';
import type { Expense, ColumnDef } from '@/lib/types';
import { CURRENCIES } from '@/lib/types';

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
  const { profile, canEdit } = useAuth();
  const [filterDept, setFilterDept] = useState<string>('all');

  const deptMapRef = useRef<Record<string, string>>({});
  const deptIdMapRef = useRef<Record<string, string>>({}); // name → id

  const fetchExpenses = useCallback(async () => {
    try {
      if (Object.keys(deptMapRef.current).length === 0) {
        const dRes = await fetch('/api/table-data?table=departments');
        if (dRes.ok) {
          const depts = await dRes.json();
          if (Array.isArray(depts)) depts.forEach((d: any) => {
            deptMapRef.current[d.id] = d.name;
            deptIdMapRef.current[d.name] = d.id;
          });
        }
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

  // Department options for the select column (sorted names + "General")
  const departmentOptions = useMemo(() => {
    const names = Object.values(deptMapRef.current).sort();
    return ['General', ...names];
  }, [expenses]); // re-derive when expenses change (ensures deptMap is populated)

  const totalUSD = expenses.reduce((sum, e) => sum + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);

  // Dynamic category options from existing data
  const categoryOptions = useMemo(() => {
    const unique = new Set(expenses.map(e => e.category?.trim()).filter(Boolean));
    return Array.from(unique).sort();
  }, [expenses]);

  const BASE_COLUMNS: ColumnDef[] = useMemo(() => [
    { key: 'date',        label: 'Date',        type: 'date',       width: '120px' },
    { key: 'description', label: 'Description', type: 'text',       width: '200px' },
    { key: 'category',    label: 'Category',    type: 'combobox' as any, options: categoryOptions, width: '130px' },
    { key: 'amount',      label: 'Amount',      type: 'number', width: '120px' },
    { key: 'currency',    label: 'Currency',    type: 'select', options: [...CURRENCIES], width: '100px' },
    { key: 'paid_by',     label: 'Paid By',     type: 'text',   width: '130px' },
    { key: 'dept_name',   label: 'Department',  type: 'select', options: departmentOptions, width: '160px' },
  ], [categoryOptions, departmentOptions]);

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

  // Filtered expenses for the table
  const filteredExpenses = useMemo(() => {
    if (filterDept === 'all') return expenses;
    if (filterDept === 'general') return expenses.filter(e => !e.department_id);
    return expenses.filter(e => e.department_id === filterDept);
  }, [expenses, filterDept]);

  const filteredTotal = filteredExpenses.reduce((sum, e) => sum + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);

  const handleAdd = useCallback(async () => {
    const tempId = `temp-${Date.now()}`;
    const today = format(new Date(), 'yyyy-MM-dd');
    // If filtering by a specific department, assign new expense to that department
    const deptId = filterDept !== 'all' && filterDept !== 'general' ? filterDept : null;
    const deptName = deptId ? (deptMapRef.current[deptId] || 'General') : 'General';
    const optimistic = {
      id: tempId, department_id: deptId, task_id: null,
      date: today, description: '', category: '',
      amount: 0, currency: 'USD', paid_by: '',
      created_by: profile?.id ?? null, created_at: '',
      dept_name: deptName,
    } as any;
    setExpenses(prev => [optimistic, ...prev]);
    const res = await fetch('/api/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department_id: deptId, date: today, description: '', category: '', amount: 0, currency: 'USD', paid_by: '' }),
    });
    if (res.ok) {
      const inserted = await res.json();
      setExpenses(prev => prev.map(row => row.id === tempId ? { ...inserted, dept_name: deptName } : row));
      toast.success('Expense added');
    } else {
      setExpenses(prev => prev.filter(row => row.id !== tempId));
      await fetchExpenses();
      toast.error('Failed to add expense');
    }
  }, [profile?.id, fetchExpenses, filterDept]);

  const handleUpdate = useCallback((id: string, key: string, value: string | number | string[]) => {
    if (id.startsWith('temp-')) return;

    // If updating dept_name, translate to department_id for the API
    if (key === 'dept_name') {
      const deptName = value as string;
      const deptId = deptName === 'General' ? null : (deptIdMapRef.current[deptName] || null);
      setExpenses(prev => prev.map(row => row.id === id ? { ...row, dept_name: deptName, department_id: deptId } : row));
      fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ department_id: deptId }) }).catch(() => { fetchExpenses(); toast.error('Failed to update expense'); });
      return;
    }

    setExpenses(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
    fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: value }) }).catch(() => { fetchExpenses(); toast.error('Failed to update expense'); });
  }, [fetchExpenses]);

  const handleDelete = useCallback(async (id: string) => {
    setExpenses(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    toast.success('Expense deleted');
    window.dispatchEvent(new CustomEvent('expenses-updated'));
  }, []);

  // Unique departments for filter tabs
  const deptTabs = useMemo(() => {
    const tabs: { id: string; label: string; count: number }[] = [
      { id: 'all', label: 'All', count: expenses.length },
      { id: 'general', label: 'General', count: expenses.filter(e => !e.department_id).length },
    ];
    const deptCounts: Record<string, number> = {};
    expenses.forEach(e => {
      if (e.department_id) {
        deptCounts[e.department_id] = (deptCounts[e.department_id] || 0) + 1;
      }
    });
    Object.entries(deptCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([deptId, count]) => {
        tabs.push({ id: deptId, label: deptMapRef.current[deptId] || deptId, count });
      });
    return tabs;
  }, [expenses]);

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

      {/* Department Filter Tabs */}
      {deptTabs.length > 2 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {deptTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterDept(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterDept === tab.id
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] ${filterDept === tab.id ? 'text-rose-400' : 'text-gray-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filtered total if filtering */}
      {filterDept !== 'all' && (
        <div className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-900">{filteredExpenses.length}</span> expenses
          {' '}&middot;{' '}
          <span className="font-semibold text-rose-600">{formatDisplay(filteredTotal)}</span>
        </div>
      )}

      {/* Editable Table */}
      <SpreadsheetTable
        columns={BASE_COLUMNS}
        data={filteredExpenses}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        addLabel="Add Expense"
        loading={loading}
        readOnly={!canEdit}
      />
    </div>
  );
}
