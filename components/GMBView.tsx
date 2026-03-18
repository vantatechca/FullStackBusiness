// 'use client';

// import { useCallback } from 'react';
// import { supabase } from '@/lib/supabase';
// import { useRealtimeTable } from '@/lib/realtime';
// import SpreadsheetTable from './SpreadsheetTable';
// import type { GMBListing, ColumnDef } from '@/lib/types';

// const columns: ColumnDef[] = [
//   { key: 'name', label: 'Business Name', type: 'text', width: '180px' },
//   { key: 'address', label: 'Address', type: 'text', width: '200px' },
//   { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Verified', 'Suspended', 'In Review'], width: '120px' },
//   { key: 'rating', label: 'Rating', type: 'number', width: '90px' },
//   { key: 'reviews', label: '# Reviews', type: 'number', width: '100px' },
//   { key: 'notes', label: 'Notes', type: 'text', width: '200px' },
// ];

// export default function GMBView() {
//   const { data, loading } = useRealtimeTable<GMBListing>('gmb_listings');

//   const handleAdd = useCallback(async () => {
//     await supabase.from('gmb_listings').insert({
//       name: '',
//       address: '',
//       status: 'Pending',
//       rating: 0,
//       reviews: 0,
//       notes: '',
//     });
//   }, []);

//   const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
//     await supabase.from('gmb_listings').update({ [key]: value }).eq('id', id);
//   }, []);

//   const handleDelete = useCallback(async (id: string) => {
//     await supabase.from('gmb_listings').delete().eq('id', id);
//   }, []);

//   return (
//     <SpreadsheetTable
//       columns={columns}
//       data={data}
//       onAdd={handleAdd}
//       onUpdate={handleUpdate}
//       onDelete={handleDelete}
//       addLabel="Add Listing"
//       loading={loading}
//     />
//   );
// }



'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from '@/lib/realtime';
import SpreadsheetTable from './SpreadsheetTable';
import type { GMBListing, ColumnDef } from '@/lib/types';

const columns: ColumnDef[] = [
  { key: 'name', label: 'Business Name', type: 'text', width: '180px' },
  { key: 'address', label: 'Address', type: 'text', width: '200px' },
  { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Verified', 'Suspended', 'In Review'], width: '120px' },
  { key: 'rating', label: 'Rating', type: 'number', width: '90px' },
  { key: 'reviews', label: '# Reviews', type: 'number', width: '100px' },
  { key: 'notes', label: 'Notes', type: 'text', width: '200px' },
];

export default function GMBView() {
  const { data, loading, refetch } = useRealtimeTable<GMBListing>('gmb_listings');

  const handleAdd = useCallback(async () => {
    await supabase.from('gmb_listings').insert({
      name: '',
      address: '',
      status: 'Pending',
      rating: 0,
      reviews: 0,
      notes: '',
    });
    await refetch();
  }, [refetch]);

  const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
    await supabase.from('gmb_listings').update({ [key]: value }).eq('id', id);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('gmb_listings').delete().eq('id', id);
  }, []);

  return (
    <SpreadsheetTable
      columns={columns}
      data={data}
      onAdd={handleAdd}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      addLabel="Add Listing"
      loading={loading}
    />
  );
}