
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
      await fetch(`/api/notes/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, updated_at: new Date().toISOString() }),
      });
    } else {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id: departmentId, content: text, updated_at: new Date().toISOString() }),
      });
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