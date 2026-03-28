
'use client';

import { useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRealtimeTable } from '@/lib/realtime';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';
import { convertToUSD } from '@/lib/exchange-rates';
import SpreadsheetTable from './SpreadsheetTable';
import type { Expense, ColumnDef } from '@/lib/types';
import { CURRENCIES } from '@/lib/types';

const columns: ColumnDef[] = [
  { key: 'date',        label: 'Date',        type: 'date',   width: '120px' },
  { key: 'description', label: 'Description', type: 'text',   width: '180px' },
  { key: 'category',    label: 'Category',    type: 'text',   width: '130px' },
  { key: 'amount',      label: 'Amount',      type: 'number', width: '120px' },
  { key: 'currency',    label: 'Currency',    type: 'select', options: [...CURRENCIES], width: '100px' },
  { key: 'paid_by',     label: 'Paid By',     type: 'text',   width: '130px' },
];

const BAR_COLORS = [
  'bg-rose-400', 'bg-blue-400', 'bg-amber-400', 'bg-violet-400',
  'bg-teal-400', 'bg-orange-400', 'bg-emerald-400', 'bg-pink-400',
];

export default function ExpensesSection({ departmentId }: { departmentId: string }) {
  const { data, loading, setData, refetch } = useRealtimeTable<Expense>('expenses', {
    column: 'department_id',
    value: departmentId,
  });
  const { profile } = useAuth();
  const { formatDisplay, rates } = useCurrency();

  const totalUSD = data.reduce(
    (sum, e) => sum + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0,
  );

  // Analytics: by category
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(e => {
      const cat = e.category?.trim() || 'Uncategorized';
      map[cat] = (map[cat] || 0) + convertToUSD(Number(e.amount) || 0, e.currency, rates);
    });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [data, rates]);

  const maxCatVal = Math.max(...byCategory.map(c => c.total), 1);

  const handleAdd = useCallback(async () => {
    const tempId = `temp-${Date.now()}`;
    const today  = format(new Date(), 'yyyy-MM-dd');
    const optimistic = {
      id: tempId, department_id: departmentId, task_id: null,
      date: today, description: '', category: '',
      amount: 0, currency: 'USD', paid_by: '',
      created_by: profile?.id ?? null, created_at: '',
    } as Expense;

    setData(prev => [...prev, optimistic]);
    const res = await fetch('/api/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department_id: departmentId, date: today, description: '', category: '', amount: 0, currency: 'USD', paid_by: '', created_by: profile?.id }),
    });
    if (res.ok) {
      const inserted = await res.json();
      setData(prev => prev.map(row => row.id === tempId ? inserted : row));
      toast.success('Expense added');
    } else {
      setData(prev => prev.filter(row => row.id !== tempId));
      await refetch();
      toast.error('Failed to add expense');
    }
  }, [departmentId, profile?.id, setData, refetch]);

  const handleUpdate = useCallback((id: string, key: string, value: string | number | string[]) => {
    setData(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
    fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: value }) }).catch(() => { toast.error('Failed to update expense'); refetch(); });
  }, [setData, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    setData(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    toast.success('Expense deleted');
    window.dispatchEvent(new CustomEvent('expenses-updated'));
  }, [setData]);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm min-w-[180px]">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-rose-600 tabular-nums">{formatDisplay(totalUSD)}</p>
          <p className="text-xs text-gray-400 mt-1">{data.length} entries</p>
        </div>

        {/* By Category breakdown */}
        {byCategory.length > 1 && (
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm min-w-[280px]">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">By Category</h3>
            </div>
            <div className="px-4 py-3 space-y-2 max-h-48 overflow-y-auto">
              {byCategory.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 shrink-0 w-28 truncate">{cat.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`} style={{ width: `${(cat.total / maxCatVal) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 tabular-nums shrink-0">{formatDisplay(cat.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <SpreadsheetTable
        columns={columns}
        data={data}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        addLabel="Add Expense"
        loading={loading}
      />
    </div>
  );
}
