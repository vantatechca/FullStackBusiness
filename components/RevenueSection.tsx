'use client';

import { useCallback } from 'react';
import { format } from 'date-fns';
import { useRealtimeTable } from '@/lib/realtime';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';
import { convertToUSD } from '@/lib/exchange-rates';
import SpreadsheetTable from './SpreadsheetTable';
import type { Revenue, ColumnDef } from '@/lib/types';
import { CURRENCIES } from '@/lib/types';

const columns: ColumnDef[] = [
  { key: 'date',     label: 'Date',     type: 'date',   width: '120px' },
  { key: 'source',   label: 'Source',   type: 'text',   width: '160px' },
  { key: 'amount',   label: 'Amount',   type: 'number', width: '120px' },
  { key: 'currency', label: 'Currency', type: 'select', options: [...CURRENCIES], width: '100px' },
  { key: 'notes',    label: 'Notes',    type: 'text',   width: '200px' },
];

export default function RevenueSection({ departmentId }: { departmentId: string }) {
  const { data, loading, setData, refetch } = useRealtimeTable<Revenue>('revenue', {
    column: 'department_id',
    value: departmentId,
  });
  const { profile } = useAuth();
  const { formatDisplay, rates } = useCurrency();

  const totalUSD = data.reduce(
    (sum, r) => sum + convertToUSD(Number(r.amount) || 0, r.currency, rates),
    0,
  );

  const handleAdd = useCallback(async () => {
    const tempId = `temp-${Date.now()}`;
    const today  = format(new Date(), 'yyyy-MM-dd');
    const optimistic = {
      id: tempId, department_id: departmentId,
      date: today, source: '', amount: 0, currency: 'USD',
      notes: '', created_by: profile?.id ?? null, created_at: '',
    } as Revenue;

    setData(prev => [...prev, optimistic]);

    const res = await fetch('/api/revenue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_id: departmentId, date: today,
        source: '', amount: 0, currency: 'USD',
        notes: '', created_by: profile?.id,
      }),
    });

    if (res.ok) {
      const inserted = await res.json();
      setData(prev => prev.map(row => row.id === tempId ? inserted : row));
    } else {
      setData(prev => prev.filter(row => row.id !== tempId));
      await refetch();
    }
  }, [departmentId, profile?.id, setData, refetch]);

  const handleUpdate = useCallback((id: string, key: string, value: string | number | string[]) => {
    setData(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
    fetch(`/api/revenue/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => refetch());
  }, [setData, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    setData(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/revenue/${id}`, { method: 'DELETE' });
  }, [setData]);

  return (
    <div>
      <div className="mb-4">
        <span className="text-lg font-bold text-[#22c55e]">
          Total: {formatDisplay(totalUSD)}
        </span>
      </div>
      <SpreadsheetTable
        columns={columns}
        data={data}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        addLabel="Add Revenue"
        loading={loading}
      />
    </div>
  );
}