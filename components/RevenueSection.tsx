// 'use client';

// import { useCallback } from 'react';
// import { format } from 'date-fns';
// import { supabase } from '@/lib/supabase';
// import { useRealtimeTable } from '@/lib/realtime';
// import { useCurrency } from '@/lib/currency-context';
// import { useAuth } from '@/lib/auth-context';
// import { convertToUSD } from '@/lib/exchange-rates';
// import SpreadsheetTable from './SpreadsheetTable';
// import type { Revenue, ColumnDef } from '@/lib/types';
// import { CURRENCIES } from '@/lib/types';

// const columns: ColumnDef[] = [
//   { key: 'date', label: 'Date', type: 'text', width: '120px' },
//   { key: 'source', label: 'Source', type: 'text', width: '160px' },
//   { key: 'amount', label: 'Amount', type: 'number', width: '120px' },
//   { key: 'currency', label: 'Currency', type: 'select', options: [...CURRENCIES], width: '100px' },
//   { key: 'notes', label: 'Notes', type: 'text', width: '200px' },
// ];

// export default function RevenueSection({ departmentId }: { departmentId: string }) {
//   const { data, loading } = useRealtimeTable<Revenue>('revenue', {
//     column: 'department_id',
//     value: departmentId,
//   });
//   const { user } = useAuth();
//   const { formatDisplay, rates } = useCurrency();

//   const totalUSD = data.reduce((sum, r) => sum + convertToUSD(Number(r.amount) || 0, r.currency, rates), 0);

//   const handleAdd = useCallback(async () => {
//     await supabase.from('revenue').insert({
//       department_id: departmentId,
//       date: format(new Date(), 'yyyy-MM-dd'),
//       source: '',
//       amount: 0,
//       currency: 'USD',
//       notes: '',
//       created_by: user?.id,
//     });
//   }, [departmentId, user?.id]);

//   const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
//     await supabase.from('revenue').update({ [key]: value }).eq('id', id);
//   }, []);

//   const handleDelete = useCallback(async (id: string) => {
//     await supabase.from('revenue').delete().eq('id', id);
//   }, []);

//   return (
//     <div>
//       <div className="mb-4">
//         <span className="text-lg font-bold text-[#22c55e]">
//           Total: {formatDisplay(totalUSD)}
//         </span>
//       </div>
//       <SpreadsheetTable
//         columns={columns}
//         data={data}
//         onAdd={handleAdd}
//         onUpdate={handleUpdate}
//         onDelete={handleDelete}
//         addLabel="Add Revenue"
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
import type { Revenue, ColumnDef } from '@/lib/types';
import { CURRENCIES } from '@/lib/types';

const columns: ColumnDef[] = [
  { key: 'date', label: 'Date', type: 'text', width: '120px' },
  { key: 'source', label: 'Source', type: 'text', width: '160px' },
  { key: 'amount', label: 'Amount', type: 'number', width: '120px' },
  { key: 'currency', label: 'Currency', type: 'select', options: [...CURRENCIES], width: '100px' },
  { key: 'notes', label: 'Notes', type: 'text', width: '200px' },
];

export default function RevenueSection({ departmentId }: { departmentId: string }) {
  const { data, loading, setData, refetch } = useRealtimeTable<Revenue>('revenue', {
    column: 'department_id',
    value: departmentId,
  });
  const { user } = useAuth();
  const { formatDisplay, rates } = useCurrency();

  const totalUSD = data.reduce((sum, r) => sum + convertToUSD(Number(r.amount) || 0, r.currency, rates), 0);

  const handleAdd = useCallback(async () => {
    const { data: inserted } = await supabase
      .from('revenue')
      .insert({
        department_id: departmentId,
        date: format(new Date(), 'yyyy-MM-dd'),
        source: '',
        amount: 0,
        currency: 'USD',
        notes: '',
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
    await supabase.from('revenue').update({ [key]: value }).eq('id', id);
  }, []);

const handleDelete = useCallback(async (id: string) => {
  await supabase.from('revenue').delete().eq('id', id);
  setData(prev => prev.filter(row => row.id !== id));
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