// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
// import { supabase } from '@/lib/supabase';
// import { getDepartment } from '@/lib/departments';
// import type { Task } from '@/lib/types';

// type FilterType = 'all' | 'To Do' | 'In Progress' | 'Done';
// type SortField = 'none' | 'status' | 'priority' | 'recurrence';
// type SortDir = 'asc' | 'desc';

// const STATUS_ORDER: Record<string, number> = { 'To Do': 0, 'In Progress': 1, 'Done': 2 };
// const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
// const RECURRENCE_ORDER: Record<string, number> = { Daily: 0, Weekly: 1, Monthly: 2, 'One-Time': 3 };

// const RECURRENCE_COLORS: Record<string, string> = {
//   Daily: 'bg-blue-50 text-blue-600 border-blue-100',
//   Weekly: 'bg-teal-50 text-teal-600 border-teal-100',
//   Monthly: 'bg-violet-50 text-violet-600 border-violet-100',
//   'One-Time': 'bg-gray-50 text-gray-500 border-gray-200',
// };

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

// export default function GlobalTasksView() {
//   const [tasks, setTasks] = useState<(Task & { dept_name: string })[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState<FilterType>('all');
//   const [sortField, setSortField] = useState<SortField>('none');
//   const [sortDir, setSortDir] = useState<SortDir>('asc');

//   useEffect(() => {
//     const fetchTasks = async () => {
//       const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
//       if (data) {
//         setTasks(data.map(t => ({
//           ...t,
//           recurrence: t.recurrence ?? 'One-Time',
//           dept_name: getDepartment(t.department_id)?.name || t.department_id,
//         })));
//       }
//       setLoading(false);
//     };
//     fetchTasks();

//     const channel = supabase
//       .channel('global-tasks')
//       .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
//         fetchTasks();
//       })
//       .subscribe();

//     return () => { supabase.removeChannel(channel); };
//   }, []);

//   const counts = {
//     all: tasks.length,
//     'To Do': tasks.filter(t => t.status === 'To Do').length,
//     'In Progress': tasks.filter(t => t.status === 'In Progress').length,
//     Done: tasks.filter(t => t.status === 'Done').length,
//   };

//   function toggleSort(field: SortField) {
//     if (sortField === field) {
//       if (sortDir === 'asc') setSortDir('desc');
//       else { setSortField('none'); setSortDir('asc'); }
//     } else {
//       setSortField(field);
//       setSortDir('asc');
//     }
//   }

//   const filtered = useMemo(() => {
//     const list = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
//     if (sortField === 'none') return list;
//     return [...list].sort((a, b) => {
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
//   }, [tasks, filter, sortField, sortDir]);

//   const statusColor = (s: string) => {
//     if (s === 'To Do') return 'bg-red-50 text-red-600 border-red-100';
//     if (s === 'In Progress') return 'bg-amber-50 text-amber-600 border-amber-100';
//     return 'bg-green-50 text-green-600 border-green-100';
//   };

//   const priorityColor = (p: string) => {
//     if (p === 'Urgent') return 'text-red-600 font-bold';
//     if (p === 'High') return 'text-red-500';
//     if (p === 'Medium') return 'text-amber-600';
//     return 'text-gray-500';
//   };

//   if (loading) {
//     return <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>;
//   }

//   const filterButtons: { key: FilterType; label: string }[] = [
//     { key: 'all', label: `All (${counts.all})` },
//     { key: 'To Do', label: `To Do (${counts['To Do']})` },
//     { key: 'In Progress', label: `In Progress (${counts['In Progress']})` },
//     { key: 'Done', label: `Done (${counts.Done})` },
//   ];

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
//         <div className="flex gap-2 flex-wrap">
//           {filterButtons.map(f => (
//             <button
//               key={f.key}
//               onClick={() => setFilter(f.key)}
//               className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
//                 filter === f.key
//                   ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
//                   : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
//               }`}
//             >
//               {f.label}
//             </button>
//           ))}
//         </div>
//         <div className="flex items-center gap-1.5">
//           <span className="text-[11px] text-gray-400 font-medium mr-1">Sort by:</span>
//           <SortButton field="Status" active={sortField === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
//           <SortButton field="Priority" active={sortField === 'priority'} dir={sortDir} onClick={() => toggleSort('priority')} />
//           <SortButton field="Recurrence" active={sortField === 'recurrence'} dir={sortDir} onClick={() => toggleSort('recurrence')} />
//         </div>
//       </div>

//       {filtered.length === 0 ? (
//         <p className="text-center py-12 text-gray-400 text-sm">No tasks found.</p>
//       ) : (
//         <div className="overflow-x-auto border border-gray-200 rounded-lg">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="border-b-2 border-gray-200">
//                 {['Department', 'Task', 'Recurrence', 'Status', 'Assignee', 'Deadline', 'Priority'].map(h => (
//                   <th key={h} className="text-left text-[11px] font-bold text-[#475569] uppercase tracking-wider px-3 py-2.5 bg-gray-50/80 whitespace-nowrap">
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map((task, idx) => (
//                 <tr key={task.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
//                   <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{task.dept_name}</td>
//                   <td className="px-3 py-2 text-gray-900">{task.task}</td>
//                   <td className="px-3 py-2">
//                     <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${RECURRENCE_COLORS[task.recurrence] ?? RECURRENCE_COLORS['One-Time']}`}>
//                       {task.recurrence ?? 'One-Time'}
//                     </span>
//                   </td>
//                   <td className="px-3 py-2">
//                     <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${statusColor(task.status)}`}>
//                       {task.status}
//                     </span>
//                   </td>
//                   <td className="px-3 py-2 text-gray-600">{task.assignee}</td>
//                   <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{task.deadline}</td>
//                   <td className={`px-3 py-2 text-xs whitespace-nowrap ${priorityColor(task.priority)}`}>{task.priority}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }









'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { getDepartment } from '@/lib/departments';
import type { Task } from '@/lib/types';

type FilterType = 'all' | 'To Do' | 'In Progress' | 'Done';
type SortField = 'none' | 'status' | 'priority' | 'recurrence';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<string, number> = { 'To Do': 0, 'In Progress': 1, 'Done': 2 };
const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const RECURRENCE_ORDER: Record<string, number> = { Daily: 0, Weekly: 1, Monthly: 2, 'One-Time': 3 };

const RECURRENCE_COLORS: Record<string, string> = {
  Daily: 'bg-blue-50 text-blue-600 border-blue-100',
  Weekly: 'bg-teal-50 text-teal-600 border-teal-100',
  Monthly: 'bg-violet-50 text-violet-600 border-violet-100',
  'One-Time': 'bg-gray-50 text-gray-500 border-gray-200',
};

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

export default function GlobalTasksView() {
  const [tasks, setTasks] = useState<(Task & { dept_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [allMemberNames, setAllMemberNames] = useState<string[]>([]);

  // Fetch all team member names for the assignee dropdown
  useEffect(() => {
    fetch('/api/team-members')
      .then(res => res.ok ? res.json() : [])
      .then((members: { name: string }[]) => {
        const names = members
          .map(m => m.name)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setAllMemberNames(names);
      })
      .catch(() => setAllMemberNames([]));
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/table-data?table=tasks');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTasks(
        [...data]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map(t => ({
            ...t,
            recurrence: t.recurrence ?? 'One-Time',
            dept_name: getDepartment(t.department_id)?.name || t.department_id,
          }))
      );
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleAssigneeChange = useCallback(async (taskId: string, assignee: string) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignee } : t));
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee }),
    });
  }, []);

  const counts = {
    all: tasks.length,
    'To Do': tasks.filter(t => t.status === 'To Do').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    Done: tasks.filter(t => t.status === 'Done').length,
  };

  function toggleSort(field: SortField) {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortField('none'); setSortDir('asc'); }
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    const list = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
    if (sortField === 'none') return list;
    return [...list].sort((a, b) => {
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
  }, [tasks, filter, sortField, sortDir]);

  const statusColor = (s: string) => {
    if (s === 'To Do') return 'bg-red-50 text-red-600 border-red-100';
    if (s === 'In Progress') return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-green-50 text-green-600 border-green-100';
  };

  const priorityColor = (p: string) => {
    if (p === 'Urgent') return 'text-red-600 font-bold';
    if (p === 'High') return 'text-red-500';
    if (p === 'Medium') return 'text-amber-600';
    return 'text-gray-500';
  };

  if (loading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>;
  }

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'To Do', label: `To Do (${counts['To Do']})` },
    { key: 'In Progress', label: `In Progress (${counts['In Progress']})` },
    { key: 'Done', label: `Done (${counts.Done})` },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {filterButtons.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filter === f.key
                  ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400 font-medium mr-1">Sort by:</span>
          <SortButton field="Status" active={sortField === 'status'} dir={sortDir} onClick={() => toggleSort('status')} />
          <SortButton field="Priority" active={sortField === 'priority'} dir={sortDir} onClick={() => toggleSort('priority')} />
          <SortButton field="Recurrence" active={sortField === 'recurrence'} dir={sortDir} onClick={() => toggleSort('recurrence')} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-gray-400 text-sm">No tasks found.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {['Department', 'Task', 'Recurrence', 'Status', 'Assignee', 'Deadline', 'Priority'].map(h => (
                  <th key={h} className="text-left text-[11px] font-bold text-[#475569] uppercase tracking-wider px-3 py-2.5 bg-gray-50/80 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, idx) => (
                <tr key={task.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{task.dept_name}</td>
                  <td className="px-3 py-2 text-gray-900">{task.task}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${RECURRENCE_COLORS[task.recurrence] ?? RECURRENCE_COLORS['One-Time']}`}>
                      {task.recurrence ?? 'One-Time'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${statusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-3 py-1.5">
                    <select
                      value={task.assignee || ''}
                      onChange={e => handleAssigneeChange(task.id, e.target.value)}
                      className={`w-full px-2 py-1 text-sm rounded-md border transition-colors outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer ${
                        task.assignee && !allMemberNames.includes(task.assignee)
                          ? 'border-amber-300 bg-amber-50 text-amber-700' // highlight mismatched legacy values
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <option value="">— Unassigned —</option>
                      {/* Show current value even if it's a legacy mismatch so it's selectable/clearable */}
                      {task.assignee && !allMemberNames.includes(task.assignee) && (
                        <option value={task.assignee}>{task.assignee} ⚠️</option>
                      )}
                      {allMemberNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{task.deadline}</td>
                  <td className={`px-3 py-2 text-xs whitespace-nowrap ${priorityColor(task.priority)}`}>{task.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

