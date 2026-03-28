'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getDepartment } from '@/lib/departments';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';
import { convertToUSD } from '@/lib/exchange-rates';
import SpreadsheetTable from './SpreadsheetTable';
import type { Revenue, ColumnDef } from '@/lib/types';
import { CURRENCIES } from '@/lib/types';

const columns: ColumnDef[] = [
  { key: 'date',     label: 'Date',     type: 'date',   width: '120px' },
  { key: 'source',   label: 'Source',   type: 'text',   width: '180px' },
  { key: 'amount',   label: 'Amount',   type: 'number', width: '120px' },
  { key: 'currency', label: 'Currency', type: 'select', options: [...CURRENCIES], width: '100px' },
  { key: 'notes',    label: 'Notes',    type: 'text',   width: '200px' },
];

const BAR_COLORS = [
  'bg-emerald-400', 'bg-blue-400', 'bg-violet-400', 'bg-amber-400',
  'bg-teal-400', 'bg-rose-400', 'bg-orange-400', 'bg-pink-400',
];
const SOURCE_COLORS = [
  'bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700', 'bg-teal-100 text-teal-700', 'bg-rose-100 text-rose-700',
  'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700',
];

export default function GlobalRevenueView() {
  const [revenue, setRevenue] = useState<(Revenue & { dept_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatDisplay, rates } = useCurrency();
  const { profile } = useAuth();

  const fetchRevenue = useCallback(async () => {
    try {
      const res = await fetch('/api/table-data?table=revenue');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setRevenue(
        (Array.isArray(data) ? data : [])
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((r: any) => ({
            ...r,
            dept_name: r.department_id ? (getDepartment(r.department_id)?.name || r.department_id) : 'General',
          }))
      );
    } catch (err) {
      console.error('Failed to fetch revenue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRevenue();
    const interval = setInterval(fetchRevenue, 30000);
    return () => clearInterval(interval);
  }, [fetchRevenue]);

  const totalUSD = revenue.reduce((sum, r) => sum + convertToUSD(Number(r.amount) || 0, r.currency, rates), 0);

  // Analytics: by source
  const bySource = useMemo(() => {
    const map: Record<string, number> = {};
    revenue.forEach(r => {
      const src = r.source?.trim() || 'Other';
      map[src] = (map[src] || 0) + convertToUSD(Number(r.amount) || 0, r.currency, rates);
    });
    return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [revenue, rates]);

  // Analytics: by department
  const byDepartment = useMemo(() => {
    const map: Record<string, number> = {};
    revenue.forEach(r => {
      const dept = r.dept_name || 'General';
      map[dept] = (map[dept] || 0) + convertToUSD(Number(r.amount) || 0, r.currency, rates);
    });
    return Object.entries(map).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [revenue, rates]);

  const maxSourceVal = Math.max(...bySource.map(s => s.total), 1);
  const maxDeptVal = Math.max(...byDepartment.map(d => d.total), 1);

  const handleAdd = useCallback(async () => {
    const tempId = `temp-${Date.now()}`;
    const today = format(new Date(), 'yyyy-MM-dd');
    const optimistic = {
      id: tempId, department_id: '',
      date: today, source: '', amount: 0, currency: 'USD',
      notes: '', created_by: profile?.id ?? null, created_at: '',
      dept_name: 'General',
    } as any;
    setRevenue(prev => [optimistic, ...prev]);
    const res = await fetch('/api/revenue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department_id: null, date: today, source: '', amount: 0, currency: 'USD', notes: '' }),
    });
    if (res.ok) {
      const inserted = await res.json();
      setRevenue(prev => prev.map(row => row.id === tempId ? { ...inserted, dept_name: 'General' } : row));
      toast.success('Revenue added');
    } else {
      setRevenue(prev => prev.filter(row => row.id !== tempId));
      await fetchRevenue();
      toast.error('Failed to add revenue');
    }
  }, [profile?.id, fetchRevenue]);

  const handleUpdate = useCallback((id: string, key: string, value: string | number | string[]) => {
    if (id.startsWith('temp-')) return;
    setRevenue(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
    fetch(`/api/revenue/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: value }) })
      .catch(() => { fetchRevenue(); toast.error('Failed to update revenue'); });
  }, [fetchRevenue]);

  const handleDelete = useCallback(async (id: string) => {
    setRevenue(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/revenue/${id}`, { method: 'DELETE' });
    toast.success('Revenue entry deleted');
  }, []);

  if (loading) {
    return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Revenue</p>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{formatDisplay(totalUSD)}</p>
          <p className="text-xs text-gray-400 mt-1">{revenue.length} entries</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sources</p>
          <p className="text-2xl font-bold text-gray-900">{bySource.length}</p>
          <p className="text-xs text-gray-400 mt-1">Top: {bySource[0]?.name || '—'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Departments</p>
          <p className="text-2xl font-bold text-gray-900">{byDepartment.length}</p>
          <p className="text-xs text-gray-400 mt-1">Highest: {byDepartment[0]?.name || '—'}</p>
        </div>
      </div>

      {/* Breakdown: Source + Department */}
      {revenue.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* By Source */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">By Source</h3>
            </div>
            <div className="px-5 py-3 space-y-2.5 max-h-56 overflow-y-auto">
              {bySource.map((src, i) => (
                <div key={src.name} className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${SOURCE_COLORS[i % SOURCE_COLORS.length]}`}>{src.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`} style={{ width: `${(src.total / maxSourceVal) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 tabular-nums shrink-0 w-20 text-right">{formatDisplay(src.total)}</span>
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
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(dept.total / maxDeptVal) * 100}%` }} />
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
        data={revenue}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        addLabel="Add Revenue"
        loading={loading}
      />
    </div>
  );
}
