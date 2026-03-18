// 'use client';

// import { useCallback } from 'react';
// import { supabase } from '@/lib/supabase';
// import { useRealtimeTable } from '@/lib/realtime';
// import { useCurrency } from '@/lib/currency-context';
// import { convertToUSD } from '@/lib/exchange-rates';
// import SpreadsheetTable from './SpreadsheetTable';
// import type { Supplier, ColumnDef } from '@/lib/types';
// import { CURRENCIES } from '@/lib/types';

// const columns: ColumnDef[] = [
//   { key: 'name', label: 'Supplier Name', type: 'text', width: '150px' },
//   { key: 'product', label: 'Product', type: 'text', width: '150px' },
//   { key: 'cogs', label: 'COGS/Unit', type: 'number', width: '110px' },
//   { key: 'currency', label: 'Currency', type: 'select', options: [...CURRENCIES], width: '100px' },
//   { key: 'qty', label: 'Qty Ordered', type: 'number', width: '100px' },
//   { key: 'contact', label: 'Contact', type: 'text', width: '140px' },
//   { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Ordered', 'Shipped', 'Received'], width: '110px' },
//   { key: 'notes', label: 'Notes', type: 'text', width: '160px' },
// ];

// export default function RestockView() {
//   const { data, loading } = useRealtimeTable<Supplier>('suppliers');
//   const { formatDisplay, rates } = useCurrency();

//   const totalCOGS = data.reduce((sum, s) => {
//     const lineTotal = (Number(s.cogs) || 0) * (Number(s.qty) || 0);
//     return sum + convertToUSD(lineTotal, s.currency, rates);
//   }, 0);

//   const handleAdd = useCallback(async () => {
//     await supabase.from('suppliers').insert({
//       name: '',
//       product: '',
//       cogs: 0,
//       currency: 'USD',
//       qty: 0,
//       contact: '',
//       status: 'Pending',
//       notes: '',
//     });
//   }, []);

//   const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
//     await supabase.from('suppliers').update({ [key]: value }).eq('id', id);
//   }, []);

//   const handleDelete = useCallback(async (id: string) => {
//     await supabase.from('suppliers').delete().eq('id', id);
//   }, []);

//   return (
//     <div>
//       <div className="mb-4">
//         <span className="text-lg font-bold text-[#ef4444]">
//           Total COGS: {formatDisplay(totalCOGS)}
//         </span>
//       </div>
//       <SpreadsheetTable
//         columns={columns}
//         data={data}
//         onAdd={handleAdd}
//         onUpdate={handleUpdate}
//         onDelete={handleDelete}
//         addLabel="Add Supplier"
//         loading={loading}
//       />
//     </div>
//   );
// }



'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from '@/lib/realtime';
import { useCurrency } from '@/lib/currency-context';
import { convertToUSD } from '@/lib/exchange-rates';
import SpreadsheetTable from './SpreadsheetTable';
import type { Supplier, ColumnDef } from '@/lib/types';
import { CURRENCIES } from '@/lib/types';

const columns: ColumnDef[] = [
  { key: 'name', label: 'Supplier Name', type: 'text', width: '150px' },
  { key: 'product', label: 'Product', type: 'text', width: '150px' },
  { key: 'cogs', label: 'COGS/Unit', type: 'number', width: '110px' },
  { key: 'currency', label: 'Currency', type: 'select', options: [...CURRENCIES], width: '100px' },
  { key: 'qty', label: 'Qty Ordered', type: 'number', width: '100px' },
  { key: 'contact', label: 'Contact', type: 'text', width: '140px' },
  { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Ordered', 'Shipped', 'Received'], width: '110px' },
  { key: 'notes', label: 'Notes', type: 'text', width: '160px' },
];

export default function RestockView() {
  const { data, loading, refetch } = useRealtimeTable<Supplier>('suppliers');
  const { formatDisplay, rates } = useCurrency();

  const totalCOGS = data.reduce((sum, s) => {
    const lineTotal = (Number(s.cogs) || 0) * (Number(s.qty) || 0);
    return sum + convertToUSD(lineTotal, s.currency, rates);
  }, 0);

  const handleAdd = useCallback(async () => {
    await supabase.from('suppliers').insert({
      name: '',
      product: '',
      cogs: 0,
      currency: 'USD',
      qty: 0,
      contact: '',
      status: 'Pending',
      notes: '',
    });
    await refetch();
  }, [refetch]);

  const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
    await supabase.from('suppliers').update({ [key]: value }).eq('id', id);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('suppliers').delete().eq('id', id);
  }, []);

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