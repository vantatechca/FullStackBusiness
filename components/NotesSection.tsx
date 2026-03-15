'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeSingle } from '@/lib/realtime';
import type { DepartmentNote } from '@/lib/types';

export default function NotesSection({ departmentId }: { departmentId: string }) {
  const { data, loading } = useRealtimeSingle<DepartmentNote>('department_notes', {
    column: 'department_id',
    value: departmentId,
  });
  const [content, setContent] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (data && !initializedRef.current) {
      setContent(data.content || '');
      initializedRef.current = true;
    }
    if (!data && !loading && !initializedRef.current) {
      initializedRef.current = true;
    }
  }, [data, loading]);

  const saveNote = useCallback(async (text: string) => {
    if (data?.id) {
      await supabase
        .from('department_notes')
        .update({ content: text, updated_at: new Date().toISOString() })
        .eq('id', data.id);
    } else {
      await supabase
        .from('department_notes')
        .insert({ department_id: departmentId, content: text, updated_at: new Date().toISOString() });
    }
  }, [data?.id, departmentId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNote(text), 500);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (loading) {
    return <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />;
  }

  return (
    <textarea
      value={content}
      onChange={handleChange}
      placeholder="Add notes, links, reminders..."
      className="w-full min-h-[300px] p-4 text-sm border border-gray-200 rounded-lg resize-y focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none bg-white"
    />
  );
}
