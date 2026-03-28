'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { getDepartment } from '@/lib/departments';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';
import { convertToUSD } from '@/lib/exchange-rates';
import SpreadsheetTable from './SpreadsheetTable';
import QuickAddModal from './QuickAddModal';
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

export default function GlobalExpensesView() {
  const [expenses, setExpenses] = useState<(Expense & { dept_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const { formatDisplay, rates } = useCurrency();
  const { profile } = useAuth();

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch('/api/table-data?table=expenses');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setExpenses(
        [...data]
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((e: any) => ({
            ...e,
            dept_name: e.department_id ? (getDepartment(e.department_id)?.name || e.department_id) : 'General',
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
    return () => {
      clearInterval(interval);
      window.removeEventListener('expenses-updated', fetchExpenses);
    };
  }, [fetchExpenses]);

  const totalUSD = expenses.reduce((sum, e) => sum + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);

  const handleAdd = useCallback(async () => {
    const tempId = `temp-${Date.now()}`;
    const today = format(new Date(), 'yyyy-MM-dd');
    const optimistic = {
      id: tempId, department_id: '',
      date: today, description: '', category: '',
      amount: 0, currency: 'USD', paid_by: '',
      created_by: profile?.id ?? null, created_at: '',
      dept_name: 'General',
    } as any;

    setExpenses(prev => [optimistic, ...prev]);

    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_id: null, date: today,
        description: '', category: '', amount: 0,
        currency: 'USD', paid_by: '',
      }),
    });

    if (res.ok) {
      const inserted = await res.json();
      setExpenses(prev => prev.map(row => row.id === tempId ? { ...inserted, dept_name: 'General' } : row));
    } else {
      setExpenses(prev => prev.filter(row => row.id !== tempId));
      await fetchExpenses();
    }
  }, [profile?.id, fetchExpenses]);

  const handleUpdate = useCallback((id: string, key: string, value: string | number | string[]) => {
    if (id.startsWith('temp-')) return;
    setExpenses(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
    fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => fetchExpenses());
  }, [fetchExpenses]);

  const handleDelete = useCallback(async (id: string) => {
    setExpenses(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    window.dispatchEvent(new CustomEvent('expenses-updated'));
  }, []);

  return (
    <div className="space-y-5">
      {/* Header with total and quick add */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="text-lg font-bold text-[#ef4444]">
            Total Expenses: {formatDisplay(totalUSD)}
          </span>
          <p className="text-xs text-gray-400 mt-0.5">{expenses.length} entries across all departments</p>
        </div>
        <button
          onClick={() => setShowQuickAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm"
        >
          <Plus size={14} />
          Quick Add Expense
        </button>
      </div>

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

      <QuickAddModal open={showQuickAdd} onClose={() => { setShowQuickAdd(false); fetchExpenses(); }} defaultType="expense" />
    </div>
  );
}
