// import { useEffect, useState, useCallback } from 'react';
// import { supabase } from './supabase';

// export function useRealtimeTable<T extends { id: string }>(
//   table: string,
//   filter?: { column: string; value: string }
// ) {
//   const [data, setData] = useState<T[]>([]);
//   const [loading, setLoading] = useState(true);

//   const fetchData = useCallback(async () => {
//     let query = supabase.from(table).select('*');
//     if (filter) {
//       query = query.eq(filter.column, filter.value);
//     }
//     query = query.order('created_at', { ascending: true });
//     const { data: rows } = await query;
//     setData((rows as T[]) || []);
//     setLoading(false);
//   }, [table, filter?.column, filter?.value]);

//   useEffect(() => {
//     fetchData();

//     const channelName = filter
//       ? `${table}-${filter.column}-${filter.value}`
//       : table;

//     const channel = supabase
//       .channel(channelName)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table,
//           ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
//         },
//         (payload) => {
//           if (payload.eventType === 'INSERT') {
//             setData(prev => [...prev, payload.new as T]);
//           } else if (payload.eventType === 'UPDATE') {
//             setData(prev =>
//               prev.map(row => (row.id === (payload.new as T).id ? (payload.new as T) : row))
//             );
//           } else if (payload.eventType === 'DELETE') {
//             setData(prev =>
//               prev.filter(row => row.id !== (payload.old as T).id)
//             );
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [table, filter?.column, filter?.value, fetchData]);

//   return { data, setData, loading, refetch: fetchData };
// }

// export function useRealtimeSingle<T extends { id?: string; department_id?: string }>(
//   table: string,
//   filter: { column: string; value: string }
// ) {
//   const [data, setData] = useState<T | null>(null);
//   const [loading, setLoading] = useState(true);

//   const fetchData = useCallback(async () => {
//     const { data: row } = await supabase
//       .from(table)
//       .select('*')
//       .eq(filter.column, filter.value)
//       .maybeSingle();
//     setData(row as T | null);
//     setLoading(false);
//   }, [table, filter.column, filter.value]);

//   useEffect(() => {
//     fetchData();

//     const channel = supabase
//       .channel(`${table}-single-${filter.value}`)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table,
//           filter: `${filter.column}=eq.${filter.value}`,
//         },
//         (payload) => {
//           if (payload.eventType === 'DELETE') {
//             setData(null);
//           } else {
//             setData(payload.new as T);
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [table, filter.column, filter.value, fetchData]);

//   return { data, setData, loading, refetch: fetchData };
// }



// import { useEffect, useState, useCallback } from 'react';
// import { supabase } from './supabase';

// export function useRealtimeTable<T extends { id: string }>(
//   table: string,
//   filter?: { column: string; value: string }
// ) {
//   const [data, setData] = useState<T[]>([]);
//   const [loading, setLoading] = useState(true);

//   const fetchData = useCallback(async () => {
//     let query = supabase.from(table).select('*');
//     if (filter) {
//       query = query.eq(filter.column, filter.value);
//     }
//     query = query.order('created_at', { ascending: true });
//     const { data: rows } = await query;
//     setData((rows as T[]) || []);
//     setLoading(false);
//   }, [table, filter?.column, filter?.value]);

//   useEffect(() => {
//     fetchData();

//     const channelName = filter
//       ? `${table}-${filter.column}-${filter.value}`
//       : table;

//     const channel = supabase
//       .channel(channelName)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table,
//           ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
//         },
//         (payload) => {
//           if (payload.eventType === 'INSERT') {
//             setData(prev => {
//               // Dedup: skip if already added optimistically via .select().single()
//               if (prev.some(row => row.id === (payload.new as T).id)) return prev;
//               return [...prev, payload.new as T];
//             });
//           } else if (payload.eventType === 'UPDATE') {
//             setData(prev =>
//               prev.map(row => (row.id === (payload.new as T).id ? (payload.new as T) : row))
//             );
//           } else if (payload.eventType === 'DELETE') {
//             setData(prev =>
//               prev.filter(row => row.id !== (payload.old as T).id)
//             );
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [table, filter?.column, filter?.value, fetchData]);

//   return { data, setData, loading, refetch: fetchData };
// }

// export function useRealtimeSingle<T extends { id?: string; department_id?: string }>(
//   table: string,
//   filter: { column: string; value: string }
// ) {
//   const [data, setData] = useState<T | null>(null);
//   const [loading, setLoading] = useState(true);

//   const fetchData = useCallback(async () => {
//     const { data: row } = await supabase
//       .from(table)
//       .select('*')
//       .eq(filter.column, filter.value)
//       .maybeSingle();
//     setData(row as T | null);
//     setLoading(false);
//   }, [table, filter.column, filter.value]);

//   useEffect(() => {
//     fetchData();

//     const channel = supabase
//       .channel(`${table}-single-${filter.value}`)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table,
//           filter: `${filter.column}=eq.${filter.value}`,
//         },
//         (payload) => {
//           if (payload.eventType === 'DELETE') {
//             setData(null);
//           } else {
//             setData(payload.new as T);
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [table, filter.column, filter.value, fetchData]);

//   return { data, setData, loading, refetch: fetchData };
// }

































'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export function useRealtimeTable<T extends { id: string }>(
  table: string,
  filter?: { column: string; value: string }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ table });
      if (filter) {
        params.set('filterColumn', filter.column);
        params.set('filterValue', filter.value);
      }
      const res = await fetch(`/api/table-data?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const rows = await res.json();
      setData(rows as T[]);
    } catch (err) {
      console.error(`Failed to fetch ${table}:`, err);
    } finally {
      setLoading(false);
    }
  }, [table, filter?.column, filter?.value]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 10000); // 10s
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { data, setData, loading, refetch: fetchData };
}

export function useRealtimeSingle<T extends { id?: string; department_id?: string }>(
  table: string,
  filter: { column: string; value: string }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        table,
        filterColumn: filter.column,
        filterValue: filter.value,
        single: 'true',
      });
      const res = await fetch(`/api/table-data?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const row = await res.json();
      setData(row as T | null);
    } catch (err) {
      console.error(`Failed to fetch ${table}:`, err);
    } finally {
      setLoading(false);
    }
  }, [table, filter.column, filter.value]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 10000); // 10s
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return { data, setData, loading, refetch: fetchData };
}