'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, Clock, Circle, ListTodo, Plus,
} from 'lucide-react';
import { getDepartment } from '@/lib/departments';
import { useAuth } from '@/lib/auth-context';
import SpreadsheetTable from './SpreadsheetTable';
import QuickAddModal from './QuickAddModal';
import type { Task, ColumnDef } from '@/lib/types';

type FilterType = 'all' | 'To Do' | 'In Progress' | 'Done';
type SortField = 'none' | 'status' | 'priority' | 'recurrence';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<string, number> = { 'To Do': 0, 'In Progress': 1, 'Done': 2 };
const PRIORITY_ORDER: Record<string, number> = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
const RECURRENCE_ORDER: Record<string, number> = { Daily: 0, Weekly: 1, Monthly: 2, 'One-Time': 3 };

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
  { key: 'task',       label: 'Task',       type: 'text',         width: '200px' },
  { key: 'recurrence', label: 'Recurrence', type: 'select',       options: ['Daily', 'Weekly', 'Monthly', 'One-Time'], width: '120px' },
  { key: 'status',     label: 'Status',     type: 'select',       options: ['To Do', 'In Progress', 'Done'], width: '120px' },
  { key: 'assignees',  label: 'Assignees',  type: 'multi-select', options: [], width: '160px' },
  { key: 'deadline',   label: 'Deadline',   type: 'date',         width: '150px' },
  { key: 'priority',   label: 'Priority',   type: 'select',       options: ['Low', 'Medium', 'High', 'Urgent'], width: '110px' },
  { key: 'notes',      label: 'Notes',      type: 'text',         width: '180px' },
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
      {active ? dir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} /> : <ArrowUpDown size={11} />}
    </button>
  );
}

export default function GlobalTasksView() {
  const [tasks, setTasks] = useState<(Task & { dept_name: string })[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDir, setSortDir]     = useState<SortDir>('asc');
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const { profile } = useAuth();

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/table-data?table=tasks');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTasks(
        [...data]
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map((t: any) => ({
            ...t,
            recurrence: t.recurrence ?? 'One-Time',
            dept_name: t.department_id ? (getDepartment(t.department_id)?.name || t.department_id) : 'General',
            assignees: parseAssignees(t.assignees ?? t.assignee),
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

  useEffect(() => {
    fetch('/api/table-data?table=team_members').then(r => r.json()).then(m => {
      setMemberNames((m || []).map((member: any) => member.name).filter(Boolean).sort());
    }).catch(() => {});
    fetch('/api/departments').then(r => r.json()).then(d => {
      setDepartments((d || []).filter((dept: any) => ['standard', 'gmb', 'influencers', 'restock'].includes(dept.type)));
    }).catch(() => {});
  }, []);

  const columns: ColumnDef[] = useMemo(() =>
    BASE_COLUMNS.map(col =>
      col.key === 'assignees' ? { ...col, options: memberNames } : col
    ),
    [memberNames],
  );

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
    } else {
      setSortField(field); setSortDir('asc');
    }
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

  const handleAdd = useCallback(async () => {
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId, department_id: '',
      task: '', recurrence: 'One-Time', status: 'To Do',
      assignees: [], assignee: '',
      deadline: '', priority: 'Medium', notes: '',
      created_by: profile?.id ?? null,
      dept_name: 'General',
    } as any;

    setTasks(prev => [optimistic, ...prev]);

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_id: null, task: '', recurrence: 'One-Time',
        status: 'To Do', assignees: [], assignee: '',
        deadline: '', priority: 'Medium', notes: '',
      }),
    });

    if (res.ok) {
      const inserted = await res.json();
      setTasks(prev => prev.map(row => row.id === tempId ? { ...inserted, dept_name: 'General', assignees: [] } : row));
    } else {
      setTasks(prev => prev.filter(row => row.id !== tempId));
      await fetchTasks();
    }
  }, [profile?.id, fetchTasks]);

  const handleUpdate = useCallback((id: string, key: string, value: string | number | string[]) => {
    if (id.startsWith('temp-')) return;
    setTasks(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
    const body: Record<string, unknown> = { [key]: value };
    if (key === 'assignees' && Array.isArray(value)) body.assignee = value[0] ?? '';
    fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => fetchTasks());
  }, [fetchTasks]);

  const handleDelete = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
  }, []);

  return (
    <div className="space-y-5">

      {/* Stat cards + progress */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { key: 'To Do',       count: counts['To Do'],       icon: <Circle size={15} className="text-red-400 shrink-0" />,          cls: 'bg-red-50 border-red-100 text-red-600'             },
          { key: 'In Progress', count: counts['In Progress'], icon: <Clock size={15} className="text-amber-400 shrink-0" />,          cls: 'bg-amber-50 border-amber-100 text-amber-600'       },
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
        {counts.all > 0 && (
          <div className="flex-1 min-w-[140px]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-gray-400 font-medium">Completion</span>
              <span className="text-[11px] font-bold text-gray-600">{completionPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Filter pills + sort + Quick Add */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {([
            { key: 'all',         label: `All (${counts.all})`                    },
            { key: 'To Do',       label: `To Do (${counts['To Do']})`             },
            { key: 'In Progress', label: `In Progress (${counts['In Progress']})` },
            { key: 'Done',        label: `Done (${counts.Done})`                  },
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400 font-medium mr-0.5">Sort:</span>
            <SortButton field="Status"     active={sortField === 'status'}     dir={sortDir} onClick={() => toggleSort('status')} />
            <SortButton field="Priority"   active={sortField === 'priority'}   dir={sortDir} onClick={() => toggleSort('priority')} />
            <SortButton field="Recurrence" active={sortField === 'recurrence'} dir={sortDir} onClick={() => toggleSort('recurrence')} />
          </div>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3b82f6] text-white text-xs font-medium rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm"
          >
            <Plus size={13} />
            Quick Add
          </button>
        </div>
      </div>

      {/* Editable Table */}
      <SpreadsheetTable
        columns={columns}
        data={filtered}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        addLabel="Add Task"
        loading={loading}
      />

      <QuickAddModal open={showQuickAdd} onClose={() => { setShowQuickAdd(false); fetchTasks(); }} defaultType="task" />
    </div>
  );
}
