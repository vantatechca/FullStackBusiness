// 'use client';

// import { useCallback } from 'react';
// import { format } from 'date-fns';
// import { supabase } from '@/lib/supabase';
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
//   const { data, loading } = useRealtimeTable<Expense>('expenses', {
//     column: 'department_id',
//     value: departmentId,
//   });
//   const { user } = useAuth();
//   const { formatDisplay, rates } = useCurrency();

//   const totalUSD = data.reduce((sum, e) => sum + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);

//   const handleAdd = useCallback(async () => {
//     await supabase.from('expenses').insert({
//       department_id: departmentId,
//       date: format(new Date(), 'yyyy-MM-dd'),
//       description: '',
//       category: '',
//       amount: 0,
//       currency: 'USD',
//       paid_by: '',
//       created_by: user?.id,
//     });
//   }, [departmentId, user?.id]);

//   const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
//     await supabase.from('expenses').update({ [key]: value }).eq('id', id);
//   }, []);

//   const handleDelete = useCallback(async (id: string) => {
//     await supabase.from('expenses').delete().eq('id', id);
//   }, []);

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
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from '@/lib/realtime';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';
import { convertToUSD } from '@/lib/exchange-rates';
import SpreadsheetTable from './SpreadsheetTable';
import type { Expense, ColumnDef } from '@/lib/types';
import { CURRENCIES } from '@/lib/types';

const columns: ColumnDef[] = [
  { key: 'date', label: 'Date', type: 'text', width: '120px' },
  { key: 'description', label: 'Description', type: 'text', width: '180px' },
  { key: 'category', label: 'Category', type: 'text', width: '130px' },
  { key: 'amount', label: 'Amount', type: 'number', width: '120px' },
  { key: 'currency', label: 'Currency', type: 'select', options: [...CURRENCIES], width: '100px' },
  { key: 'paid_by', label: 'Paid By', type: 'text', width: '130px' },
];

export default function ExpensesSection({ departmentId }: { departmentId: string }) {
  const { data, loading, setData, refetch } = useRealtimeTable<Expense>('expenses', {
    column: 'department_id',
    value: departmentId,
  });
  const { user } = useAuth();
  const { formatDisplay, rates } = useCurrency();

  const totalUSD = data.reduce((sum, e) => sum + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);

  const handleAdd = useCallback(async () => {
    const { data: inserted } = await supabase
      .from('expenses')
      .insert({
        department_id: departmentId,
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        category: '',
        amount: 0,
        currency: 'USD',
        paid_by: '',
        created_by: user?.id,
      })
      .select()
      .single();

    if (inserted) {
      setData(prev => [...prev, inserted]);
    } else {
      await refetch();
    }
  }, [departmentId, user?.id, setData, refetch]);

  const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
    await supabase.from('expenses').update({ [key]: value }).eq('id', id);
  }, []);

const handleDelete = useCallback(async (id: string) => {
  await supabase.from('expenses').delete().eq('id', id);
  setData(prev => prev.filter(row => row.id !== id));
  window.dispatchEvent(new CustomEvent('expenses-updated')); // ← add this
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