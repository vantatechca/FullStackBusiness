// 'use client';

// import { useCallback } from 'react';
// import { supabase } from '@/lib/supabase';
// import { useRealtimeTable } from '@/lib/realtime';
// import { useCurrency } from '@/lib/currency-context';
// import SpreadsheetTable from './SpreadsheetTable';
// import type { Influencer, ColumnDef } from '@/lib/types';

// const columns: ColumnDef[] = [
//   { key: 'name', label: 'Name', type: 'text', width: '140px' },
//   { key: 'platform', label: 'Platform', type: 'select', options: ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'Facebook', 'Other'], width: '120px' },
//   { key: 'followers', label: 'Followers', type: 'text', width: '110px' },
//   { key: 'promo_code', label: 'Promo Code', type: 'text', width: '120px' },
//   { key: 'commission_pct', label: 'Commission %', type: 'number', width: '110px' },
//   { key: 'revenue', label: 'Revenue Generated', type: 'number', width: '140px' },
//   { key: 'contact', label: 'Contact Info', type: 'text', width: '150px' },
//   { key: 'notes', label: 'Notes', type: 'text', width: '160px' },
// ];

// export default function InfluencersView() {
//   const { data, loading } = useRealtimeTable<Influencer>('influencers');
//   const { formatDisplay } = useCurrency();

//   const totalRevenue = data.reduce((sum, i) => sum + (Number(i.revenue) || 0), 0);

//   const handleAdd = useCallback(async () => {
//     await supabase.from('influencers').insert({
//       name: '',
//       platform: 'Instagram',
//       followers: '',
//       promo_code: '',
//       commission_pct: 0,
//       revenue: 0,
//       contact: '',
//       notes: '',
//     });
//   }, []);

//   const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
//     await supabase.from('influencers').update({ [key]: value }).eq('id', id);
//   }, []);

//   const handleDelete = useCallback(async (id: string) => {
//     await supabase.from('influencers').delete().eq('id', id);
//   }, []);

//   return (
//     <div>
//       <div className="mb-4">
//         <span className="text-lg font-bold text-[#22c55e]">
//           Total Influencer Revenue: {formatDisplay(totalRevenue)}
//         </span>
//       </div>
//       <SpreadsheetTable
//         columns={columns}
//         data={data}
//         onAdd={handleAdd}
//         onUpdate={handleUpdate}
//         onDelete={handleDelete}
//         addLabel="Add Influencer"
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
    const { data: inserted } = await supabase
      .from('influencers')
      .insert({
        name: '',
        platform: 'Instagram',
        followers: '',
        promo_code: '',
        commission_pct: 0,
        revenue: 0,
        contact: '',
        notes: '',
      })
      .select()
      .single();

    if (inserted) {
      setData(prev => [...prev, inserted]);
    } else {
      await refetch();
    }
  }, [setData, refetch]);

  const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
    await supabase.from('influencers').update({ [key]: value }).eq('id', id);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('influencers').delete().eq('id', id);
  }, []);

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