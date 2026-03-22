
// 'use client';

// import { useEffect, useState, useCallback, useRef } from 'react';

// export function useRealtimeTable<T extends { id: string }>(
//   table: string,
//   filter?: { column: string; value: string }
// ) {
//   const [data, setData] = useState<T[]>([]);
//   const [loading, setLoading] = useState(true);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);

//   const fetchData = useCallback(async () => {
//     try {
//       const params = new URLSearchParams({ table });
//       if (filter) {
//         params.set('filterColumn', filter.column);
//         params.set('filterValue', filter.value);
//       }
//       const res = await fetch(`/api/table-data?${params}`);
//       if (!res.ok) throw new Error('Failed to fetch');
//       const rows = await res.json();
//       setData(rows as T[]);
//     } catch (err) {
//       console.error(`Failed to fetch ${table}:`, err);
//     } finally {
//       setLoading(false);
//     }
//   }, [table, filter?.column, filter?.value]);

//   useEffect(() => {
//     fetchData();
//     intervalRef.current = setInterval(fetchData, 10000); // 10s
//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, [fetchData]);

//   return { data, setData, loading, refetch: fetchData };
// }

// export function useRealtimeSingle<T extends { id?: string; department_id?: string }>(
//   table: string,
//   filter: { column: string; value: string }
// ) {
//   const [data, setData] = useState<T | null>(null);
//   const [loading, setLoading] = useState(true);
//   const intervalRef = useRef<NodeJS.Timeout | null>(null);

//   const fetchData = useCallback(async () => {
//     try {
//       const params = new URLSearchParams({
//         table,
//         filterColumn: filter.column,
//         filterValue: filter.value,
//         single: 'true',
//       });
//       const res = await fetch(`/api/table-data?${params}`);
//       if (!res.ok) throw new Error('Failed to fetch');
//       const row = await res.json();
//       setData(row as T | null);
//     } catch (err) {
//       console.error(`Failed to fetch ${table}:`, err);
//     } finally {
//       setLoading(false);
//     }
//   }, [table, filter.column, filter.value]);

//   useEffect(() => {
//     fetchData();
//     intervalRef.current = setInterval(fetchData, 10000); // 10s
//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//     };
//   }, [fetchData]);

//   return { data, setData, loading, refetch: fetchData };
// }



'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ─── useRealtimeTable ─────────────────────────────────────────────────────────
// Fixes:
// 1. Stable filter ref — filter object is compared by value, not identity,
//    so inline `{ column, value }` props don't cause infinite fetch loops.
// 2. Skip setData if server response is identical to current state (no flicker).
// 3. Poll interval raised to 30s — optimistic updates handle instant feedback,
//    polling is just a background safety net for multi-tab/multi-user sync.

export function useRealtimeTable<T extends { id: string }>(
  table: string,
  filter?: { column: string; value: string }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  // Stable refs — avoid recreating fetchData when filter object identity changes
  const filterColumnRef = useRef(filter?.column);
  const filterValueRef = useRef(filter?.value);
  const dataRef = useRef<T[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep refs in sync with latest values
  filterColumnRef.current = filter?.column;
  filterValueRef.current = filter?.value;
  dataRef.current = data;

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ table });
      if (filterColumnRef.current && filterValueRef.current) {
        params.set('filterColumn', filterColumnRef.current);
        params.set('filterValue', filterValueRef.current);
      }

      const res = await fetch(`/api/table-data?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const rows = await res.json() as T[];

      // Skip re-render if data is identical — prevents flicker during polling
      const prev = dataRef.current;
      const changed =
        rows.length !== prev.length ||
        rows.some((row, i) => {
          const old = prev[i];
          if (!old || row.id !== old.id) return true;
          // Quick JSON compare for changed fields
          return JSON.stringify(row) !== JSON.stringify(old);
        });

      if (changed) {
        setData(rows);
      }
    } catch (err) {
      console.error(`Failed to fetch ${table}:`, err);
    } finally {
      setLoading(false);
    }
  }, [table]); // table is the only real dep — filter read from refs

  useEffect(() => {
    setLoading(true);
    fetchData();

    // 30s poll — optimistic updates handle instant UI, this syncs other tabs/users
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Re-fetch immediately when filter values change (e.g. navigating departments)
  const prevFilterValue = useRef(filter?.value);
  useEffect(() => {
    if (prevFilterValue.current !== filter?.value) {
      prevFilterValue.current = filter?.value;
      setLoading(true);
      fetchData();
    }
  }, [filter?.value, fetchData]);

  return { data, setData, loading, refetch: fetchData };
}

// ─── useRealtimeSingle ────────────────────────────────────────────────────────

export function useRealtimeSingle<T extends { id?: string; department_id?: string }>(
  table: string,
  filter: { column: string; value: string }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const filterColumnRef = useRef(filter.column);
  const filterValueRef = useRef(filter.value);
  const dataRef = useRef<T | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  filterColumnRef.current = filter.column;
  filterValueRef.current = filter.value;
  dataRef.current = data;

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        table,
        filterColumn: filterColumnRef.current,
        filterValue: filterValueRef.current,
        single: 'true',
      });

      const res = await fetch(`/api/table-data?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const row = await res.json() as T | null;

      // Skip re-render if unchanged
      if (JSON.stringify(row) !== JSON.stringify(dataRef.current)) {
        setData(row);
      }
    } catch (err) {
      console.error(`Failed to fetch ${table}:`, err);
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const prevFilterValue = useRef(filter.value);
  useEffect(() => {
    if (prevFilterValue.current !== filter.value) {
      prevFilterValue.current = filter.value;
      setLoading(true);
      fetchData();
    }
  }, [filter.value, fetchData]);

  return { data, setData, loading, refetch: fetchData };
}