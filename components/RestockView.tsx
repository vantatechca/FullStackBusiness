'use client';

import { useCallback } from 'react';
import { useRealtimeTable } from '@/lib/realtime';
import { useCurrency } from '@/lib/currency-context';
import { convertToUSD } from '@/lib/exchange-rates';
import SpreadsheetTable from './SpreadsheetTable';
import type { Supplier, ColumnDef } from '@/lib/types';
import { CURRENCIES } from '@/lib/types';

const columns: ColumnDef[] = [
  { key: 'name',    label: 'Supplier Name', type: 'text',   width: '150px' },
  { key: 'product', label: 'Product',       type: 'text',   width: '150px' },
  { key: 'cogs',    label: 'COGS/Unit',     type: 'number', width: '110px' },
  { key: 'currency',label: 'Currency',      type: 'select', options: [...CURRENCIES], width: '100px' },
  { key: 'qty',     label: 'Qty Ordered',   type: 'number', width: '100px' },
  { key: 'contact', label: 'Contact',       type: 'text',   width: '140px' },
  { key: 'status',  label: 'Status',        type: 'select', options: ['Pending', 'Ordered', 'Shipped', 'Received'], width: '110px' },
  { key: 'notes',   label: 'Notes',         type: 'text',   width: '160px' },
];

export default function RestockView() {
  const { data, loading, setData, refetch } = useRealtimeTable<Supplier>('suppliers');
  const { formatDisplay, rates } = useCurrency();

  const totalCOGS = data.reduce((sum, s) => {
    const lineTotal = (Number(s.cogs) || 0) * (Number(s.qty) || 0);
    return sum + convertToUSD(lineTotal, s.currency, rates);
  }, 0);

  const handleAdd = useCallback(async () => {
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId, name: '', product: '', cogs: 0, currency: 'USD',
      qty: 0, contact: '', status: 'Pending', notes: '', created_at: '',
    } as Supplier;

    setData(prev => [...prev, optimistic]);

    const res = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '', product: '', cogs: 0, currency: 'USD',
        qty: 0, contact: '', status: 'Pending', notes: '',
      }),
    });

    if (res.ok) {
      const inserted = await res.json();
      setData(prev => prev.map(row => row.id === tempId ? inserted : row));
    } else {
      setData(prev => prev.filter(row => row.id !== tempId));
      await refetch();
    }
  }, [setData, refetch]);

  const handleUpdate = useCallback((id: string, key: string, value: string | number | string[]) => {
    setData(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
    fetch(`/api/suppliers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => refetch());
  }, [setData, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    setData(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
  }, [setData]);

  return (
    <div>
      <div className="mb-4">
        <span className="text-lg font-bold text-[#ef4444]">
          Total COGS: {formatDisplay(totalCOGS)}
        </span>
      </div>
      <SpreadsheetTable
        columns={columns}
        data={data}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        addLabel="Add Supplier"
        loading={loading}
      />
    </div>
  );
}