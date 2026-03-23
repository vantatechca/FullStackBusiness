
'use client';

import { useCallback } from 'react';
import { useRealtimeTable } from '@/lib/realtime';
import { useCurrency } from '@/lib/currency-context';
import SpreadsheetTable from './SpreadsheetTable';
import type { Influencer, ColumnDef } from '@/lib/types';

const columns: ColumnDef[] = [
  { key: 'name', label: 'Name', type: 'text', width: '140px' },
  { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Facebook', 'Other'], width: '120px' },
  { key: 'followers', label: 'Followers', type: 'text', width: '110px' },
  { key: 'promo_code', label: 'Promo Code', type: 'text', width: '120px' },
  { key: 'commission_pct', label: 'Commission %', type: 'number', width: '110px' },
  { key: 'revenue', label: 'Revenue Generated', type: 'number', width: '140px' },
  { key: 'contact', label: 'Contact Info', type: 'text', width: '150px' },
  { key: 'notes', label: 'Notes', type: 'text', width: '160px' },
];

export default function InfluencersView() {
  const { data, loading, setData, refetch } = useRealtimeTable<Influencer>('influencers');
  const { formatDisplay } = useCurrency();

  const totalRevenue = data.reduce((sum, i) => sum + (Number(i.revenue) || 0), 0);

const handleAdd = useCallback(async () => {
  const tempId = `temp-${Date.now()}`;
  const optimistic = {
    id: tempId, name: '', platform: 'Instagram', followers: '',
    promo_code: '', commission_pct: 0, revenue: 0,
    contact: '', notes: '', created_at: '',
  } as Influencer;

  setData(prev => [...prev, optimistic]);

  const res = await fetch('/api/influencers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '', platform: 'Instagram', followers: '',
      promo_code: '', commission_pct: 0, revenue: 0,
      contact: '', notes: '',
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
  fetch(`/api/influencers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [key]: value }),
  }).catch(() => refetch());
}, [setData, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/influencers/${id}`, { method: 'DELETE' });
    setData(prev => prev.filter(row => row.id !== id));
  }, [setData]);

  return (
    <div>
      <div className="mb-4">
        <span className="text-lg font-bold text-[#22c55e]">
          Total Influencer Revenue: {formatDisplay(totalRevenue)}
        </span>
      </div>
      <SpreadsheetTable
        columns={columns}
        data={data}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        addLabel="Add Influencer"
        loading={loading}
      />
    </div>
  );
}