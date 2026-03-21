// 'use client';

// import { useState, useCallback, useMemo } from 'react';
// import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
// import { supabase } from '@/lib/supabase';
// import { useRealtimeTable } from '@/lib/realtime';
// import { useAuth } from '@/lib/auth-context';
// import SpreadsheetTable from './SpreadsheetTable';
// import type { Task, ColumnDef } from '@/lib/types';

// type SortField = 'none' | 'status' | 'priority' | 'recurrence';
// type SortDir = 'asc' | 'desc';

// const STATUS_ORDER: Record<string, number> = { 'To Do': 0, 'In Progress': 1, 'Done': 2 };
// const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
// const RECURRENCE_ORDER: Record<string, number> = { Daily: 0, Weekly: 1, Monthly: 2, 'One-Time': 3 };

// const columns: ColumnDef[] = [
//   { key: 'task', label: 'Task', type: 'text', width: '200px' },
//   { key: 'recurrence', label: 'Recurrence', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'One-Time'], width: '120px' },
//   { key: 'status', label: 'Status', type: 'select', options: ['To Do', 'In Progress', 'Done'], width: '120px' },
//   { key: 'assignee', label: 'Assignee', type: 'text', width: '130px' },
//   { key: 'deadline', label: 'Deadline', type: 'text', width: '120px' },
//   { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'], width: '110px' },
//   { key: 'notes', label: 'Notes', type: 'text', width: '180px' },
// ];

// function SortButton({ field, active, dir, onClick }: { field: string; active: boolean; dir: SortDir; onClick: () => void }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
//         active
//           ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
//           : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
//       }`}
//     >
//       {field}
//       {active ? (
//         dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
//       ) : (
//         <ArrowUpDown size={11} />
//       )}
//     </button>
//   );
// }

// export default function TasksSection({ departmentId }: { departmentId: string }) {
//   const { data, loading } = useRealtimeTable<Task>('tasks', {
//     column: 'department_id',
//     value: departmentId,
//   });
//   const { user } = useAuth();
//   const [sortField, setSortField] = useState<SortField>('none');
//   const [sortDir, setSortDir] = useState<SortDir>('asc');

//   const todoCount = data.filter(t => t.status === 'To Do').length;
//   const inProgressCount = data.filter(t => t.status === 'In Progress').length;
//   const doneCount = data.filter(t => t.status === 'Done').length;

//   function toggleSort(field: SortField) {
//     if (sortField === field) {
//       if (sortDir === 'asc') setSortDir('desc');
//       else { setSortField('none'); setSortDir('asc'); }
//     } else {
//       setSortField(field);
//       setSortDir('asc');
//     }
//   }

//   const sorted = useMemo(() => {
//     if (sortField === 'none') return data;
//     return [...data].sort((a, b) => {
//       let valA: number;
//       let valB: number;
//       if (sortField === 'status') {
//         valA = STATUS_ORDER[a.status] ?? 99;
//         valB = STATUS_ORDER[b.status] ?? 99;
//       } else if (sortField === 'recurrence') {
//         valA = RECURRENCE_ORDER[a.recurrence] ?? 99;
//         valB = RECURRENCE_ORDER[b.recurrence] ?? 99;
//       } else {
//         valA = PRIORITY_ORDER[a.priority] ?? 99;
//         valB = PRIORITY_ORDER[b.priority] ?? 99;
//       }
//       return sortDir === 'asc' ? valA - valB : valB - valA;
//     });
//   }, [data, sortField, sortDir]);

//   const handleAdd = useCallback(async () => {
//     await supabase.from('tasks').insert({
//       department_id: departmentId,
//       task: '',
//       recurrence: 'One-Time',
//       status: 'To Do',
//       assignee: '',
//       deadline: '',
//       priority: 'Medium',
//       notes: '',
//       created_by: user?.id,
//     });
//   }, [departmentId, user?.id]);

//   const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
//     await supabase.from('tasks').update({ [key]: value }).eq('id', id);
//   }, []);

//   const handleDelete = useCallback(async (id: string) => {
//     await supabase.from('tasks').delete().eq('id', id);
//   }, []);

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
//         <div className="flex gap-2 flex-wrap">
//           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
//             To Do: {todoCount}
//           </span>
//           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
//             In Progress: {inProgressCount}
//           </span>
//           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100">
//             Done: {doneCount}
//           </span>
//         </div>
//         <div className="flex items-center gap-1.5">
//           <span className="text-[11px] text-gray-400 font-medium mr-1">Sort by:</span>
//           <SortButton field="Status" active={sortField === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
//           <SortButton field="Priority" active={sortField === 'priority'} dir={sortDir} onClick={() => toggleSort('priority')} />
//           <SortButton field="Recurrence" active={sortField === 'recurrence'} dir={sortDir} onClick={() => toggleSort('recurrence')} />
//         </div>
//       </div>
//       <SpreadsheetTable
//         columns={columns}
//         data={sorted}
//         onAdd={handleAdd}
//         onUpdate={handleUpdate}
//         onDelete={handleDelete}
//         addLabel="Add Task"
//         loading={loading}
//       />
//     </div>
//   );
// }





// 'use client';

// import { useState, useCallback, useMemo } from 'react';
// import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
// import { supabase } from '@/lib/supabase';
// import { useRealtimeTable } from '@/lib/realtime';
// import { useAuth } from '@/lib/auth-context';
// import SpreadsheetTable from './SpreadsheetTable';
// import type { Task, ColumnDef } from '@/lib/types';

// type SortField = 'none' | 'status' | 'priority' | 'recurrence';
// type SortDir = 'asc' | 'desc';

// const STATUS_ORDER: Record<string, number> = { 'To Do': 0, 'In Progress': 1, 'Done': 2 };
// const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
// const RECURRENCE_ORDER: Record<string, number> = { Daily: 0, Weekly: 1, Monthly: 2, 'One-Time': 3 };

// const columns: ColumnDef[] = [
//   { key: 'task', label: 'Task', type: 'text', width: '200px' },
//   { key: 'recurrence', label: 'Recurrence', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'One-Time'], width: '120px' },
//   { key: 'status', label: 'Status', type: 'select', options: ['To Do', 'In Progress', 'Done'], width: '120px' },
//   { key: 'assignee', label: 'Assignee', type: 'text', width: '130px' },
//   { key: 'deadline', label: 'Deadline', type: 'text', width: '120px' },
//   { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'], width: '110px' },
//   { key: 'notes', label: 'Notes', type: 'text', width: '180px' },
// ];

// function SortButton({ field, active, dir, onClick }: { field: string; active: boolean; dir: SortDir; onClick: () => void }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
//         active
//           ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
//           : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
//       }`}
//     >
//       {field}
//       {active ? (
//         dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
//       ) : (
//         <ArrowUpDown size={11} />
//       )}
//     </button>
//   );
// }

// export default function TasksSection({ departmentId }: { departmentId: string }) {
//   const { data, loading, setData, refetch } = useRealtimeTable<Task>('tasks', {
//     column: 'department_id',
//     value: departmentId,
//   });
//   const { user } = useAuth();
//   const [sortField, setSortField] = useState<SortField>('none');
//   const [sortDir, setSortDir] = useState<SortDir>('asc');

//   const todoCount = data.filter(t => t.status === 'To Do').length;
//   const inProgressCount = data.filter(t => t.status === 'In Progress').length;
//   const doneCount = data.filter(t => t.status === 'Done').length;

//   function toggleSort(field: SortField) {
//     if (sortField === field) {
//       if (sortDir === 'asc') setSortDir('desc');
//       else { setSortField('none'); setSortDir('asc'); }
//     } else {
//       setSortField(field);
//       setSortDir('asc');
//     }
//   }

//   const sorted = useMemo(() => {
//     if (sortField === 'none') return data;
//     return [...data].sort((a, b) => {
//       let valA: number;
//       let valB: number;
//       if (sortField === 'status') {
//         valA = STATUS_ORDER[a.status] ?? 99;
//         valB = STATUS_ORDER[b.status] ?? 99;
//       } else if (sortField === 'recurrence') {
//         valA = RECURRENCE_ORDER[a.recurrence] ?? 99;
//         valB = RECURRENCE_ORDER[b.recurrence] ?? 99;
//       } else {
//         valA = PRIORITY_ORDER[a.priority] ?? 99;
//         valB = PRIORITY_ORDER[b.priority] ?? 99;
//       }
//       return sortDir === 'asc' ? valA - valB : valB - valA;
//     });
//   }, [data, sortField, sortDir]);

//   const handleAdd = useCallback(async () => {
//     const { data: inserted } = await supabase
//       .from('tasks')
//       .insert({
//         department_id: departmentId,
//         task: '',
//         recurrence: 'One-Time',
//         status: 'To Do',
//         assignee: '',
//         deadline: '',
//         priority: 'Medium',
//         notes: '',
//         created_by: user?.id,
//       })
//       .select()
//       .single();

//     if (inserted) {
//       setData(prev => [...prev, inserted]);
//     } else {
//       await refetch();
//     }
//   }, [departmentId, user?.id, setData, refetch]);

//   const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
//     await supabase.from('tasks').update({ [key]: value }).eq('id', id);
//   }, []);

// const handleDelete = useCallback(async (id: string) => {
//   await supabase.from('department_team_members').delete().eq('id', id);
//   setData(prev => prev.filter(row => row.id !== id));
// }, [setData]);

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
//         <div className="flex gap-2 flex-wrap">
//           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
//             To Do: {todoCount}
//           </span>
//           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
//             In Progress: {inProgressCount}
//           </span>
//           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100">
//             Done: {doneCount}
//           </span>
//         </div>
//         <div className="flex items-center gap-1.5">
//           <span className="text-[11px] text-gray-400 font-medium mr-1">Sort by:</span>
//           <SortButton field="Status" active={sortField === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
//           <SortButton field="Priority" active={sortField === 'priority'} dir={sortDir} onClick={() => toggleSort('priority')} />
//           <SortButton field="Recurrence" active={sortField === 'recurrence'} dir={sortDir} onClick={() => toggleSort('recurrence')} />
//         </div>
//       </div>
//       <SpreadsheetTable
//         columns={columns}
//         data={sorted}
//         onAdd={handleAdd}
//         onUpdate={handleUpdate}
//         onDelete={handleDelete}
//         addLabel="Add Task"
//         loading={loading}
//       />
//     </div>
//   );
// }













'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useRealtimeTable } from '@/lib/realtime';
import { useAuth } from '@/lib/auth-context';
import SpreadsheetTable from './SpreadsheetTable';
import type { Task, ColumnDef } from '@/lib/types';

type SortField = 'none' | 'status' | 'priority' | 'recurrence';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<string, number> = { 'To Do': 0, 'In Progress': 1, 'Done': 2 };
const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const RECURRENCE_ORDER: Record<string, number> = { Daily: 0, Weekly: 1, Monthly: 2, 'One-Time': 3 };

const BASE_COLUMNS: ColumnDef[] = [
  { key: 'task',       label: 'Task',       type: 'text',   width: '200px' },
  { key: 'recurrence', label: 'Recurrence', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'One-Time'], width: '120px' },
  { key: 'status',     label: 'Status',     type: 'select', options: ['To Do', 'In Progress', 'Done'], width: '120px' },
  { key: 'assignee',   label: 'Assignee',   type: 'select', options: [], width: '130px' }, // options injected below
  { key: 'deadline',   label: 'Deadline',   type: 'date',   width: '150px' },
  { key: 'priority',   label: 'Priority',   type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'], width: '110px' },
  { key: 'notes',      label: 'Notes',      type: 'text',   width: '180px' },
];

function SortButton({ field, active, dir, onClick }: { field: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
        active
          ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {field}
      {active ? (
        dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
      ) : (
        <ArrowUpDown size={11} />
      )}
    </button>
  );
}

export default function TasksSection({ departmentId }: { departmentId: string }) {
  const { data, loading, setData, refetch } = useRealtimeTable<Task>('tasks', {
    column: 'department_id',
    value: departmentId,
  });
  const { profile } = useAuth();
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [memberNames, setMemberNames] = useState<string[]>([]);

  // Fetch department members to populate assignee dropdown
  useEffect(() => {
    fetch(`/api/department-team-members?department_id=${encodeURIComponent(departmentId)}`)
      .then(res => res.ok ? res.json() : [])
      .then((rows: { name: string }[]) => {
        const names = rows
          .map(r => r.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setMemberNames(names);
      })
      .catch(() => setMemberNames([]));
  }, [departmentId]);

  // Re-fetch members when team section updates (e.g. member added/removed)
  useEffect(() => {
    const handler = () => {
      fetch(`/api/department-team-members?department_id=${encodeURIComponent(departmentId)}`)
        .then(res => res.ok ? res.json() : [])
        .then((rows: { name: string }[]) => {
          setMemberNames(
            rows.map(r => r.name).filter(Boolean).sort((a, b) => a.localeCompare(b))
          );
        })
        .catch(() => {});
    };
    window.addEventListener('department-team-members-updated', handler);
    return () => window.removeEventListener('department-team-members-updated', handler);
  }, [departmentId]);

  // Inject live member names into the assignee column options
  const columns: ColumnDef[] = useMemo(() => {
    return BASE_COLUMNS.map(col =>
      col.key === 'assignee'
        ? { ...col, options: ['', ...memberNames] } // empty string = unassigned
        : col
    );
  }, [memberNames]);

  const todoCount = data.filter(t => t.status === 'To Do').length;
  const inProgressCount = data.filter(t => t.status === 'In Progress').length;
  const doneCount = data.filter(t => t.status === 'Done').length;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortField('none'); setSortDir('asc'); }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const sorted = useMemo(() => {
    if (sortField === 'none') return data;
    return [...data].sort((a, b) => {
      let valA: number;
      let valB: number;
      if (sortField === 'status') {
        valA = STATUS_ORDER[a.status] ?? 99;
        valB = STATUS_ORDER[b.status] ?? 99;
      } else if (sortField === 'recurrence') {
        valA = RECURRENCE_ORDER[a.recurrence] ?? 99;
        valB = RECURRENCE_ORDER[b.recurrence] ?? 99;
      } else {
        valA = PRIORITY_ORDER[a.priority] ?? 99;
        valB = PRIORITY_ORDER[b.priority] ?? 99;
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [data, sortField, sortDir]);

  const handleAdd = useCallback(async () => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_id: departmentId,
        task: '',
        recurrence: 'One-Time',
        status: 'To Do',
        assignee: '',
        deadline: '',
        priority: 'Medium',
        notes: '',
        created_by: profile?.id,
      }),
    });

    if (res.ok) {
      const inserted = await res.json();
      setData(prev => [...prev, inserted]);
    } else {
      await refetch();
    }
  }, [departmentId, profile?.id, setData, refetch]);

  const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setData(prev => prev.filter(row => row.id !== id));
  }, [setData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
            To Do: {todoCount}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-100">
            In Progress: {inProgressCount}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100">
            Done: {doneCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400 font-medium mr-1">Sort by:</span>
          <SortButton field="Status" active={sortField === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
          <SortButton field="Priority" active={sortField === 'priority'} dir={sortDir} onClick={() => toggleSort('priority')} />
          <SortButton field="Recurrence" active={sortField === 'recurrence'} dir={sortDir} onClick={() => toggleSort('recurrence')} />
        </div>
      </div>
      <SpreadsheetTable
        columns={columns}
        data={sorted}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        addLabel="Add Task"
        loading={loading}
      />
    </div>
  );
}