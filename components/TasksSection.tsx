
// 'use client';

// import { useState, useCallback, useMemo, useEffect } from 'react';
// import { ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, Clock, Circle } from 'lucide-react';
// import { useRealtimeTable } from '@/lib/realtime';
// import { useAuth } from '@/lib/auth-context';
// import SpreadsheetTable from './SpreadsheetTable';
// import type { Task, ColumnDef } from '@/lib/types';

// type SortField = 'none' | 'status' | 'priority' | 'recurrence';
// type SortDir = 'asc' | 'desc';

// const STATUS_ORDER: Record<string, number> = { 'To Do': 0, 'In Progress': 1, 'Done': 2 };
// const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
// const RECURRENCE_ORDER: Record<string, number> = { Daily: 0, Weekly: 1, Monthly: 2, 'One-Time': 3 };

// const BASE_COLUMNS: ColumnDef[] = [
//   { key: 'task',       label: 'Task',       type: 'text',   width: '200px' },
//   { key: 'recurrence', label: 'Recurrence', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'One-Time'], width: '120px' },
//   { key: 'status',     label: 'Status',     type: 'select', options: ['To Do', 'In Progress', 'Done'], width: '120px' },
//   { key: 'assignee',   label: 'Assignee',   type: 'select', options: [], width: '130px' },
//   { key: 'deadline',   label: 'Deadline',   type: 'date',   width: '150px' },
//   { key: 'priority',   label: 'Priority',   type: 'select', options: ['Low', 'Medium', 'High', 'Urgent'], width: '110px' },
//   { key: 'notes',      label: 'Notes',      type: 'text',   width: '180px' },
// ];

// function SortButton({ field, active, dir, onClick }: {
//   field: string; active: boolean; dir: SortDir; onClick: () => void;
// }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
//         active
//           ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-sm'
//           : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
//       }`}
//     >
//       {field}
//       {active
//         ? dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
//         : <ArrowUpDown size={11} />
//       }
//     </button>
//   );
// }

// function StatPill({
//   label, count, colorClass, icon,
// }: {
//   label: string; count: number; colorClass: string; icon: React.ReactNode;
// }) {
//   return (
//     <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorClass}`}>
//       {icon}
//       <div>
//         <p className="text-lg font-bold leading-none">{count}</p>
//         <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mt-0.5">{label}</p>
//       </div>
//     </div>
//   );
// }

// export default function TasksSection({ departmentId }: { departmentId: string }) {
//   const { data, loading, setData, refetch } = useRealtimeTable<Task>('tasks', {
//     column: 'department_id',
//     value: departmentId,
//   });
//   const { profile } = useAuth();
//   const [sortField, setSortField] = useState<SortField>('none');
//   const [sortDir, setSortDir]     = useState<SortDir>('asc');
//   const [memberNames, setMemberNames] = useState<string[]>([]);

//   useEffect(() => {
//     fetch(`/api/department-team-members?department_id=${encodeURIComponent(departmentId)}`)
//       .then(res => res.ok ? res.json() : [])
//       .then((rows: { name: string }[]) => {
//         setMemberNames(rows.map(r => r.name).filter(Boolean).sort((a, b) => a.localeCompare(b)));
//       })
//       .catch(() => setMemberNames([]));
//   }, [departmentId]);

//   useEffect(() => {
//     const handler = () => {
//       fetch(`/api/department-team-members?department_id=${encodeURIComponent(departmentId)}`)
//         .then(res => res.ok ? res.json() : [])
//         .then((rows: { name: string }[]) => {
//           setMemberNames(rows.map(r => r.name).filter(Boolean).sort((a, b) => a.localeCompare(b)));
//         })
//         .catch(() => {});
//     };
//     window.addEventListener('department-team-members-updated', handler);
//     return () => window.removeEventListener('department-team-members-updated', handler);
//   }, [departmentId]);

//   const columns: ColumnDef[] = useMemo(() => {
//     return BASE_COLUMNS.map(col =>
//       col.key === 'assignee' ? { ...col, options: ['', ...memberNames] } : col
//     );
//   }, [memberNames]);

//   const todoCount       = data.filter(t => t.status === 'To Do').length;
//   const inProgressCount = data.filter(t => t.status === 'In Progress').length;
//   const doneCount       = data.filter(t => t.status === 'Done').length;
//   const total           = data.length;
//   const completionPct   = total > 0 ? Math.round((doneCount / total) * 100) : 0;

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
//       let valA: number, valB: number;
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
//     const tempId = `temp-${Date.now()}`;
//     const optimistic = {
//       id: tempId, department_id: departmentId,
//       task: '', recurrence: 'One-Time', status: 'To Do',
//       assignee: '', deadline: '', priority: 'Medium', notes: '',
//       created_by: profile?.id ?? null,
//     } as Task;

//     setData(prev => [...prev, optimistic]);

//     const res = await fetch('/api/tasks', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         department_id: departmentId, task: '', recurrence: 'One-Time',
//         status: 'To Do', assignee: '', deadline: '', priority: 'Medium',
//         notes: '', created_by: profile?.id,
//       }),
//     });

//     if (res.ok) {
//       const inserted = await res.json();
//       setData(prev => prev.map(row => row.id === tempId ? inserted : row));
//     } else {
//       setData(prev => prev.filter(row => row.id !== tempId));
//       await refetch();
//     }
//   }, [departmentId, profile?.id, setData, refetch]);

//   const handleUpdate = useCallback((id: string, key: string, value: string | number) => {
//     if (id.startsWith('temp-')) return;
//     setData(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
//     fetch(`/api/tasks/${id}`, {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ [key]: value }),
//     }).catch(() => refetch());
//   }, [setData, refetch]);

//   const handleDelete = useCallback(async (id: string) => {
//     setData(prev => prev.filter(row => row.id !== id));
//     await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
//   }, [setData]);

//   return (
//     <div className="space-y-4">

//       {/* Stats + progress + sort */}
//       <div className="flex items-center gap-3 flex-wrap">
//         <StatPill
//           label="To Do"
//           count={todoCount}
//           colorClass="bg-red-50 border-red-100 text-red-600"
//           icon={<Circle size={16} className="text-red-400 shrink-0" />}
//         />
//         <StatPill
//           label="In Progress"
//           count={inProgressCount}
//           colorClass="bg-amber-50 border-amber-100 text-amber-600"
//           icon={<Clock size={16} className="text-amber-400 shrink-0" />}
//         />
//         <StatPill
//           label="Done"
//           count={doneCount}
//           colorClass="bg-emerald-50 border-emerald-100 text-emerald-600"
//           icon={<CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
//         />

//         {/* Completion progress bar */}
//         {total > 0 && (
//           <div className="flex-1 min-w-[140px]">
//             <div className="flex items-center justify-between mb-1">
//               <span className="text-[11px] text-gray-400 font-medium">Completion</span>
//               <span className="text-[11px] font-bold text-gray-600">{completionPct}%</span>
//             </div>
//             <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//               <div
//                 className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
//                 style={{ width: `${completionPct}%` }}
//               />
//             </div>
//           </div>
//         )}

//         {/* Sort buttons */}
//         <div className="flex items-center gap-1.5 ml-auto">
//           <span className="text-[11px] text-gray-400 font-medium mr-0.5">Sort:</span>
//           <SortButton field="Status"     active={sortField === 'status'}     dir={sortDir} onClick={() => toggleSort('status')} />
//           <SortButton field="Priority"   active={sortField === 'priority'}   dir={sortDir} onClick={() => toggleSort('priority')} />
//           <SortButton field="Recurrence" active={sortField === 'recurrence'} dir={sortDir} onClick={() => toggleSort('recurrence')} />
//         </div>
//       </div>

//       {/* Table */}
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
import { ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, Clock, Circle } from 'lucide-react';
import { useRealtimeTable } from '@/lib/realtime';
import { useAuth } from '@/lib/auth-context';
import SpreadsheetTable from './SpreadsheetTable';
import type { Task, ColumnDef } from '@/lib/types';

type SortField = 'none' | 'status' | 'priority' | 'recurrence';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<string, number> = { 'To Do': 0, 'In Progress': 1, 'Done': 2 };
const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const RECURRENCE_ORDER: Record<string, number> = { Daily: 0, Weekly: 1, Monthly: 2, 'One-Time': 3 };

/** Normalise whatever the DB returns into a clean string[] */
function parseAssignees(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    if (raw.trim().startsWith('[')) {
      try { return JSON.parse(raw).filter(Boolean); } catch { /* fall through */ }
    }
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

const BASE_COLUMNS: ColumnDef[] = [
  { key: 'task',        label: 'Task',       type: 'text',         width: '200px' },
  { key: 'recurrence',  label: 'Recurrence', type: 'select',       options: ['Daily', 'Weekly', 'Monthly', 'One-Time'], width: '120px' },
  { key: 'status',      label: 'Status',     type: 'select',       options: ['To Do', 'In Progress', 'Done'], width: '120px' },
  { key: 'assignees',   label: 'Assignees',  type: 'multi-select', options: [], width: '160px' },
  { key: 'deadline',    label: 'Deadline',   type: 'date',         width: '150px' },
  { key: 'priority',    label: 'Priority',   type: 'select',       options: ['Low', 'Medium', 'High', 'Urgent'], width: '110px' },
  { key: 'notes',       label: 'Notes',      type: 'text',         width: '180px' },
];

function SortButton({ field, active, dir, onClick }: {
  field: string; active: boolean; dir: SortDir; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
        active
          ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-sm'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {field}
      {active
        ? dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
        : <ArrowUpDown size={11} />
      }
    </button>
  );
}

function StatPill({
  label, count, colorClass, icon,
}: {
  label: string; count: number; colorClass: string; icon: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colorClass}`}>
      {icon}
      <div>
        <p className="text-lg font-bold leading-none">{count}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function TasksSection({ departmentId }: { departmentId: string }) {
  const { data: rawData, loading, setData: setRawData, refetch } = useRealtimeTable<Task>('tasks', {
    column: 'department_id',
    value: departmentId,
  });
  const { profile } = useAuth();
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDir, setSortDir]     = useState<SortDir>('asc');
  const [memberNames, setMemberNames] = useState<string[]>([]);

  // Normalise assignees on every raw data update so the rest of the
  // component always works with string[] regardless of DB shape.
  const data = useMemo(
    () => rawData.map(t => ({
      ...t,
      assignees: parseAssignees((t as any).assignees ?? (t as any).assignee),
    })),
    [rawData],
  );

  // Proxy setData so callers don't need to worry about normalisation
  const setData: typeof setRawData = useCallback(
    updater => setRawData(updater as any),
    [setRawData],
  );

  function fetchMembers() {
    return fetch(`/api/department-team-members?department_id=${encodeURIComponent(departmentId)}`)
      .then(res => res.ok ? res.json() : [])
      .then((rows: { name: string }[]) =>
        setMemberNames(rows.map(r => r.name).filter(Boolean).sort((a, b) => a.localeCompare(b)))
      )
      .catch(() => setMemberNames([]));
  }

  useEffect(() => { fetchMembers(); }, [departmentId]);

  useEffect(() => {
    window.addEventListener('department-team-members-updated', fetchMembers);
    return () => window.removeEventListener('department-team-members-updated', fetchMembers);
  }, [departmentId]);

  const columns: ColumnDef[] = useMemo(() =>
    BASE_COLUMNS.map(col =>
      col.key === 'assignees' ? { ...col, options: memberNames } : col
    ),
    [memberNames],
  );

  const todoCount       = data.filter(t => t.status === 'To Do').length;
  const inProgressCount = data.filter(t => t.status === 'In Progress').length;
  const doneCount       = data.filter(t => t.status === 'Done').length;
  const total           = data.length;
  const completionPct   = total > 0 ? Math.round((doneCount / total) * 100) : 0;

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
      let valA: number, valB: number;
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
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId, department_id: departmentId,
      task: '', recurrence: 'One-Time', status: 'To Do',
      assignees: [], assignee: '',          // keep legacy field for compat
      deadline: '', priority: 'Medium', notes: '',
      created_by: profile?.id ?? null,
    } as unknown as Task;

    setData(prev => [...prev, optimistic]);

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_id: departmentId, task: '', recurrence: 'One-Time',
        status: 'To Do', assignees: [], assignee: '',
        deadline: '', priority: 'Medium', notes: '',
        created_by: profile?.id,
      }),
    });

    if (res.ok) {
      const inserted = await res.json();
      setData(prev => prev.map(row => row.id === tempId ? inserted : row));
    } else {
      setData(prev => prev.filter(row => row.id !== tempId));
      await refetch();
    }
  }, [departmentId, profile?.id, setData, refetch]);

  // Value is string | number for regular fields, string[] for assignees
  const handleUpdate = useCallback((
    id: string,
    key: string,
    value: string | number | string[],
  ) => {
    if (id.startsWith('temp-')) return;

    // Optimistic update
    setData(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));

    const body: Record<string, unknown> = { [key]: value };

    // Keep legacy `assignee` column in sync when assignees change
    if (key === 'assignees' && Array.isArray(value)) {
      body.assignee = value[0] ?? '';
    }

    fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => refetch());
  }, [setData, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    setData(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  }, [setData]);

  return (
    <div className="space-y-4">

      {/* Stats + progress + sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <StatPill
          label="To Do"
          count={todoCount}
          colorClass="bg-red-50 border-red-100 text-red-600"
          icon={<Circle size={16} className="text-red-400 shrink-0" />}
        />
        <StatPill
          label="In Progress"
          count={inProgressCount}
          colorClass="bg-amber-50 border-amber-100 text-amber-600"
          icon={<Clock size={16} className="text-amber-400 shrink-0" />}
        />
        <StatPill
          label="Done"
          count={doneCount}
          colorClass="bg-emerald-50 border-emerald-100 text-emerald-600"
          icon={<CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
        />

        {total > 0 && (
          <div className="flex-1 min-w-[140px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-400 font-medium">Completion</span>
              <span className="text-[11px] font-bold text-gray-600">{completionPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] text-gray-400 font-medium mr-0.5">Sort:</span>
          <SortButton field="Status"     active={sortField === 'status'}     dir={sortDir} onClick={() => toggleSort('status')} />
          <SortButton field="Priority"   active={sortField === 'priority'}   dir={sortDir} onClick={() => toggleSort('priority')} />
          <SortButton field="Recurrence" active={sortField === 'recurrence'} dir={sortDir} onClick={() => toggleSort('recurrence')} />
        </div>
      </div>

      {/* Table */}
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