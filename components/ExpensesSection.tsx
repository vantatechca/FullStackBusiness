
// 'use client';

// import { useCallback } from 'react';
// import { format } from 'date-fns';
// import { useRealtimeTable } from '@/lib/realtime';
// import { useCurrency } from '@/lib/currency-context';
// import { useAuth } from '@/lib/auth-context';
// import { convertToUSD } from '@/lib/exchange-rates';
// import SpreadsheetTable from './SpreadsheetTable';
// import type { Expense, ColumnDef } from '@/lib/types';
// import { CURRENCIES } from '@/lib/types';

// const columns: ColumnDef[] = [
//   { key: 'date', label: 'Date', type: 'text', width: '120px' },
//   { key: 'description', label: 'Description', type: 'text', width: '180px' },
//   { key: 'category', label: 'Category', type: 'text', width: '130px' },
//   { key: 'amount', label: 'Amount', type: 'number', width: '120px' },
//   { key: 'currency', label: 'Currency', type: 'select', options: [...CURRENCIES], width: '100px' },
//   { key: 'paid_by', label: 'Paid By', type: 'text', width: '130px' },
// ];

// export default function ExpensesSection({ departmentId }: { departmentId: string }) {
//   const { data, loading, setData, refetch } = useRealtimeTable<Expense>('expenses', {
//     column: 'department_id',
//     value: departmentId,
//   });
//   const { profile } = useAuth();
//   const { formatDisplay, rates } = useCurrency();

//   const totalUSD = data.reduce((sum, e) => sum + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);

//   const handleAdd = useCallback(async () => {
//     const res = await fetch('/api/expenses', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         department_id: departmentId,
//         date: format(new Date(), 'yyyy-MM-dd'),
//         description: '',
//         category: '',
//         amount: 0,
//         currency: 'USD',
//         paid_by: '',
//         created_by: profile?.id,
//       }),
//     });

//     if (res.ok) {
//       const inserted = await res.json();
//       setData(prev => [...prev, inserted]);
//     } else {
//       await refetch();
//     }
//   }, [departmentId, profile?.id, setData, refetch]);

//   const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
//     await fetch(`/api/expenses/${id}`, {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ [key]: value }),
//     });
//   }, []);

//   const handleDelete = useCallback(async (id: string) => {
//     await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
//     setData(prev => prev.filter(row => row.id !== id));
//     window.dispatchEvent(new CustomEvent('expenses-updated'));
//   }, [setData]);

//   return (
//     <div>
//       <div className="mb-4">
//         <span className="text-lg font-bold text-[#ef4444]">
//           Total: {formatDisplay(totalUSD)}
//         </span>
//       </div>
//       <SpreadsheetTable
//         columns={columns}
//         data={data}
//         onAdd={handleAdd}
//         onUpdate={handleUpdate}
//         onDelete={handleDelete}
//         addLabel="Add Expense"
//         loading={loading}
//       />
//     </div>
//   );
// }


'use client';

import { useCallback } from 'react';
import { format } from 'date-fns';
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

export default function ExpensesSection({ departmentId }: { departmentId: string }) {
  const { data, loading, setData, refetch } = useRealtimeTable<Expense>('expenses', {
    column: 'department_id',
    value: departmentId,
  });
  const { profile } = useAuth();
  const { formatDisplay, rates } = useCurrency();

  const totalUSD = data.reduce(
    (sum, e) => sum + convertToUSD(Number(e.amount) || 0, e.currency, rates),
    0,
  );

  const handleAdd = useCallback(async () => {
    const tempId = `temp-${Date.now()}`;
    const today  = format(new Date(), 'yyyy-MM-dd');
    const optimistic = {
      id: tempId, department_id: departmentId,
      date: today, description: '', category: '',
      amount: 0, currency: 'USD', paid_by: '',
      created_by: profile?.id ?? null, created_at: '',
    } as Expense;

    setData(prev => [...prev, optimistic]);

    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_id: departmentId, date: today,
        description: '', category: '', amount: 0,
        currency: 'USD', paid_by: '', created_by: profile?.id,
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
    fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => refetch());
  }, [setData, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    setData(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    window.dispatchEvent(new CustomEvent('expenses-updated'));
  }, [setData]);

  return (
    <div>
      <div className="mb-4">
        <span className="text-lg font-bold text-[#ef4444]">
          Total: {formatDisplay(totalUSD)}
        </span>
      </div>
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