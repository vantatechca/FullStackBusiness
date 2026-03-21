
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