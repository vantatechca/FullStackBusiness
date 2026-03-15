import { useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';

export function useRealtimeTable<T extends { id: string }>(
  table: string,
  filter?: { column: string; value: string }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    let query = supabase.from(table).select('*');
    if (filter) {
      query = query.eq(filter.column, filter.value);
    }
    query = query.order('created_at', { ascending: true });
    const { data: rows } = await query;
    setData((rows as T[]) || []);
    setLoading(false);
  }, [table, filter?.column, filter?.value]);

  useEffect(() => {
    fetchData();

    const channelName = filter
      ? `${table}-${filter.column}-${filter.value}`
      : table;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData(prev => [...prev, payload.new as T]);
          } else if (payload.eventType === 'UPDATE') {
            setData(prev =>
              prev.map(row => (row.id === (payload.new as T).id ? (payload.new as T) : row))
            );
          } else if (payload.eventType === 'DELETE') {
            setData(prev =>
              prev.filter(row => row.id !== (payload.old as T).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter?.column, filter?.value, fetchData]);

  return { data, setData, loading, refetch: fetchData };
}

export function useRealtimeSingle<T extends { id?: string; department_id?: string }>(
  table: string,
  filter: { column: string; value: string }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data: row } = await supabase
      .from(table)
      .select('*')
      .eq(filter.column, filter.value)
      .maybeSingle();
    setData(row as T | null);
    setLoading(false);
  }, [table, filter.column, filter.value]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel(`${table}-single-${filter.value}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${filter.column}=eq.${filter.value}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setData(null);
          } else {
            setData(payload.new as T);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter.column, filter.value, fetchData]);

  return { data, setData, loading, refetch: fetchData };
}
