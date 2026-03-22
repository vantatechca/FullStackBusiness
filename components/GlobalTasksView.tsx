
'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, Clock, Circle, ListTodo } from 'lucide-react';
import { getDepartment } from '@/lib/departments';
import type { Task } from '@/lib/types';

type FilterType = 'all' | 'To Do' | 'In Progress' | 'Done';
type SortField = 'none' | 'status' | 'priority' | 'recurrence';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<string, number> = { 'To Do': 0, 'In Progress': 1, 'Done': 2 };
const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const RECURRENCE_ORDER: Record<string, number> = { Daily: 0, Weekly: 1, Monthly: 2, 'One-Time': 3 };

const RECURRENCE_COLORS: Record<string, string> = {
  Daily:      'bg-blue-50 text-blue-600 border-blue-100',
  Weekly:     'bg-teal-50 text-teal-600 border-teal-100',
  Monthly:    'bg-violet-50 text-violet-600 border-violet-100',
  'One-Time': 'bg-gray-50 text-gray-500 border-gray-200',
};

const PRIORITY_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  Urgent: { label: 'Urgent', cls: 'text-red-600 font-bold',   dot: 'bg-red-500'    },
  High:   { label: 'High',   cls: 'text-orange-500 font-semibold', dot: 'bg-orange-400' },
  Medium: { label: 'Medium', cls: 'text-amber-600',           dot: 'bg-amber-400'  },
  Low:    { label: 'Low',    cls: 'text-gray-400',            dot: 'bg-gray-300'   },
};

const STATUS_CONFIG: Record<string, { cls: string; dot: string }> = {
  'To Do':       { cls: 'bg-red-50 text-red-600 border-red-100',       dot: 'bg-red-400'     },
  'In Progress': { cls: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-400'   },
  'Done':        { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-400' },
};

const COL_WIDTHS = {
  department: '160px',
  task:       '220px',
  recurrence: '105px',
  status:     '120px',
  assignee:   '140px',
  deadline:   '110px',
  priority:   '90px',
};

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
      {active ? dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} /> : <ArrowUpDown size={11} />}
    </button>
  );
}

const AssigneeSelect = memo(function AssigneeSelect({
  value, allMemberNames, onChange,
}: {
  value: string; allMemberNames: string[]; onChange: (val: string) => void;
}) {
  const [local, setLocal] = useState(value ?? '');
  const isMismatch = !!local && !allMemberNames.includes(local);

  useEffect(() => { setLocal(value ?? ''); }, [value]);

  return (
    <select
      value={local}
      onChange={e => { const val = e.target.value; setLocal(val); onChange(val); }}
      className={`w-full px-2 py-1 text-xs rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer ${
        isMismatch
          ? 'border-amber-300 bg-amber-50 text-amber-700'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
      }`}
    >
      <option value="">— Unassigned —</option>
      {isMismatch && <option value={local}>{local} ⚠️</option>}
      {allMemberNames.map(name => <option key={name} value={name}>{name}</option>)}
    </select>
  );
});

export default function GlobalTasksView() {
  const [tasks, setTasks] = useState<(Task & { dept_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [allMemberNames, setAllMemberNames] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/team-members')
      .then(res => res.ok ? res.json() : [])
      .then((members: { name: string }[]) => {
        setAllMemberNames(members.map(m => m.name).filter(Boolean).sort((a, b) => a.localeCompare(b)));
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

  const handleAssigneeChange = useCallback((taskId: string, assignee: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assignee } : t));
    fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee }),
    }).catch(() => fetchTasks());
  }, [fetchTasks]);

  const counts = {
    all:           tasks.length,
    'To Do':       tasks.filter(t => t.status === 'To Do').length,
    'In Progress': tasks.filter(t => t.status === 'In Progress').length,
    Done:          tasks.filter(t => t.status === 'Done').length,
  };

  const completionPct = counts.all > 0 ? Math.round((counts.Done / counts.all) * 100) : 0;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortField('none'); setSortDir('asc'); }
    } else { setSortField(field); setSortDir('asc'); }
  }

  const filtered = useMemo(() => {
    const list = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
    if (sortField === 'none') return list;
    return [...list].sort((a, b) => {
      let valA: number, valB: number;
      if (sortField === 'status') {
        valA = STATUS_ORDER[a.status] ?? 99; valB = STATUS_ORDER[b.status] ?? 99;
      } else if (sortField === 'recurrence') {
        valA = RECURRENCE_ORDER[a.recurrence] ?? 99; valB = RECURRENCE_ORDER[b.recurrence] ?? 99;
      } else {
        valA = PRIORITY_ORDER[a.priority] ?? 99; valB = PRIORITY_ORDER[b.priority] ?? 99;
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });
  }, [tasks, filter, sortField, sortDir]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Stat cards + progress ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { key: 'To Do',       count: counts['To Do'],       icon: <Circle size={15} className="text-red-400 shrink-0" />,       cls: 'bg-red-50 border-red-100 text-red-600'         },
          { key: 'In Progress', count: counts['In Progress'], icon: <Clock size={15} className="text-amber-400 shrink-0" />,       cls: 'bg-amber-50 border-amber-100 text-amber-600'   },
          { key: 'Done',        count: counts.Done,           icon: <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />, cls: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
        ].map(s => (
          <div key={s.key} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${s.cls}`}>
            {s.icon}
            <div>
              <p className="text-lg font-bold leading-none">{s.count}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mt-0.5">{s.key}</p>
            </div>
          </div>
        ))}

        {/* Progress bar */}
        {counts.all > 0 && (
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
      </div>

      {/* ── Filter pills + sort ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {([
            { key: 'all',         label: `All (${counts.all})`                       },
            { key: 'To Do',       label: `To Do (${counts['To Do']})`                },
            { key: 'In Progress', label: `In Progress (${counts['In Progress']})`    },
            { key: 'Done',        label: `Done (${counts.Done})`                     },
          ] as { key: FilterType; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                filter === f.key
                  ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400 font-medium mr-0.5">Sort:</span>
          <SortButton field="Status"     active={sortField === 'status'}     dir={sortDir} onClick={() => toggleSort('status')} />
          <SortButton field="Priority"   active={sortField === 'priority'}   dir={sortDir} onClick={() => toggleSort('priority')} />
          <SortButton field="Recurrence" active={sortField === 'recurrence'} dir={sortDir} onClick={() => toggleSort('recurrence')} />
        </div>
      </div>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <ListTodo size={22} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400 mb-1">No tasks found</p>
          <p className="text-xs text-gray-300">Try a different filter</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-2xl shadow-sm">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th style={{ width: COL_WIDTHS.department }} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3">Department</th>
                <th style={{ width: COL_WIDTHS.task }}       className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3">Task</th>
                <th style={{ width: COL_WIDTHS.recurrence }} className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3">Recurrence</th>
                <th style={{ width: COL_WIDTHS.status }}     className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3">Status</th>
                <th style={{ width: COL_WIDTHS.assignee }}   className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3">Assignee</th>
                <th style={{ width: COL_WIDTHS.deadline }}   className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3">Deadline</th>
                <th style={{ width: COL_WIDTHS.priority }}   className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3">Priority</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, idx) => {
                const statusCfg   = STATUS_CONFIG[task.status]   ?? STATUS_CONFIG['To Do'];
                const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.Low;

                return (
                  <tr
                    key={task.id}
                    className={`border-b border-gray-50 last:border-b-0 align-top hover:bg-blue-50/20 transition-colors ${
                      idx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Department */}
                    <td className="px-3 py-2.5 text-gray-600 text-xs">
                      <span className="block break-words whitespace-normal leading-snug">{task.dept_name}</span>
                    </td>

                    {/* Task */}
                    <td className="px-3 py-2.5 text-gray-900 text-xs font-medium">
                      <span className="block break-words whitespace-pre-wrap leading-snug">{task.task}</span>
                    </td>

                    {/* Recurrence */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${RECURRENCE_COLORS[task.recurrence] ?? RECURRENCE_COLORS['One-Time']}`}>
                        {task.recurrence ?? 'One-Time'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${statusCfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                        {task.status}
                      </span>
                    </td>

                    {/* Assignee */}
                    <td className="px-3 py-2">
                      <AssigneeSelect
                        value={task.assignee || ''}
                        allMemberNames={allMemberNames}
                        onChange={val => handleAssigneeChange(task.id, val)}
                      />
                    </td>

                    {/* Deadline */}
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap text-xs">{task.deadline}</td>

                    {/* Priority */}
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap ${priorityCfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityCfg.dot}`} />
                        {priorityCfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}