
'use client';

import { useState, useCallback, useRef, memo, useEffect } from 'react';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Crown, Star,
  ThumbsUp, ThumbsDown, Clock, Calendar, DollarSign,
  Briefcase, StickyNote, User, Users,
} from 'lucide-react';
import { useRealtimeTable } from '@/lib/realtime';
import { useAuth } from '@/lib/auth-context';
import type { DepartmentTeamMember } from '@/lib/types';
import { CURRENCIES } from '@/lib/types';

interface DepartmentTeamSectionProps {
  departmentId: string;
}

interface Project {
  id: string;
  name: string;
}

interface TeamMemberOption {
  id: string;
  name: string;
  role: string;
}

const AVATAR_COLORS = [
  'from-blue-400 to-blue-600',
  'from-violet-400 to-violet-600',
  'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-sky-400 to-sky-600',
  'from-teal-400 to-teal-600',
  'from-orange-400 to-orange-600',
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
      {children}
    </span>
  );
}

// ── Name Dropdown ─────────────────────────────────────────────────────────────
function NameDropdown({
  value, options, onChange,
}: {
  value: string;
  options: TeamMemberOption[];
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isMismatch = !!value && !options.find(o => o.name === value);

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 w-full text-left group"
      >
        <span className={`text-sm font-semibold truncate flex-1 ${isMismatch ? 'text-amber-600' : 'text-gray-900'}`}>
          {value
            ? <>{value}{isMismatch && <span className="ml-1 text-xs">⚠️</span>}</>
            : <span className="text-gray-300 font-normal text-sm">Select member…</span>
          }
        </span>
        <ChevronDown
          size={13}
          className={`shrink-0 text-gray-300 group-hover:text-gray-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-60 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1.5 px-1.5">
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 text-left italic rounded-lg transition-colors"
            >
              — None —
            </button>
            {isMismatch && (
              <button
                onClick={() => { onChange(value); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
              >
                <span className="flex-1 text-left truncate">{value}</span>
                <span className="text-[10px] shrink-0 opacity-70">⚠️ not in list</span>
              </button>
            )}
            {options.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No members yet</p>
            ) : (
              options.map((opt, i) => (
                <button
                  key={opt.id}
                  onClick={() => { onChange(opt.name); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-blue-50 ${
                    opt.name === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                    {(opt.name || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="truncate leading-tight">{opt.name}</div>
                    {opt.role && <div className="text-[10px] text-gray-400 leading-tight">{opt.role}</div>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LocalInput({
  value, onChange, placeholder, className, type = 'text', step, min, max,
}: {
  value: string | number; onChange: (val: string | number) => void; placeholder?: string;
  className: string; type?: 'text' | 'number'; step?: string; min?: string; max?: string;
}) {
  const [local, setLocal] = useState(String(value ?? ''));
  const isFocused = useRef(false);
  const prevValue = useRef(value);
  if (prevValue.current !== value && !isFocused.current) {
    prevValue.current = value;
    setLocal(String(value ?? ''));
  }
  return (
    <input
      type={type} step={step} min={min} max={max} value={local} placeholder={placeholder}
      onChange={e => setLocal(e.target.value)}
      onFocus={() => { isFocused.current = true; }}
      onBlur={() => {
        isFocused.current = false;
        const val = type === 'number' ? (local === '' ? 0 : parseFloat(local)) : local;
        onChange(val);
      }}
      className={className}
    />
  );
}

function LocalTextarea({
  value, onChange, placeholder, rows, className,
}: {
  value: string; onChange: (val: string) => void; placeholder?: string; rows?: number; className: string;
}) {
  const [local, setLocal] = useState(value ?? '');
  const isFocused = useRef(false);
  const prevValue = useRef(value);
  if (prevValue.current !== value && !isFocused.current) {
    prevValue.current = value;
    setLocal(value ?? '');
  }
  return (
    <textarea
      value={local} placeholder={placeholder} rows={rows}
      onChange={e => setLocal(e.target.value)}
      onFocus={() => { isFocused.current = true; }}
      onBlur={() => { isFocused.current = false; onChange(local); }}
      className={className}
    />
  );
}

interface MemberCardProps {
  member: DepartmentTeamMember;
  index: number;
  allProjects: Project[];
  teamOptions: TeamMemberOption[];
  onUpdate: (id: string, key: string, value: string | number | boolean) => void;
  onDelete: (id: string) => void;
}

const MemberCard = memo(function MemberCard({ member, index, allProjects, teamOptions, onUpdate, onDelete }: MemberCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  const selectedProjects = member.assigned_projects
    ? member.assigned_projects.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  function toggleProject(projectId: string) {
    const updated = selectedProjects.includes(projectId)
      ? selectedProjects.filter(p => p !== projectId)
      : [...selectedProjects, projectId];
    onUpdate(member.id, 'assigned_projects', updated.join(','));
  }

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
      member.in_charge
        ? 'border-amber-200 shadow-md shadow-amber-50'
        : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
    }`}>

      {/* Lead accent bar */}
      {member.in_charge && (
        <div className="h-0.5 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3">

          {/* Avatar with crown badge */}
          <div className="relative shrink-0">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>
              {member.name ? member.name[0].toUpperCase() : <User size={16} />}
            </div>
            {member.in_charge && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                <Crown size={9} className="text-white" />
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <NameDropdown
                value={member.name}
                options={teamOptions}
                onChange={val => onUpdate(member.id, 'name', val)}
              />
              {member.in_charge && (
                <span className="shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  LEAD
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <button
                onClick={() => onUpdate(member.id, 'in_charge', !member.in_charge)}
                className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
                  member.in_charge ? 'text-amber-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`relative w-7 h-3.5 rounded-full transition-colors ${member.in_charge ? 'bg-amber-400' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-transform ${member.in_charge ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </div>
                Lead
              </button>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-gray-400">Reports to:</span>
                <LocalInput
                  value={member.reports_to}
                  onChange={val => onUpdate(member.id, 'reports_to', val)}
                  placeholder="—"
                  className="text-[11px] text-gray-600 bg-transparent border-0 outline-none focus:ring-0 p-0 w-20 placeholder-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button onClick={() => onDelete(member.id)} className="text-[11px] font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors">
                  Confirm
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-[11px] font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Hrs/Day',   icon: Clock,      key: 'hours_per_day', value: member.hours_per_day, step: '0.5', max: '24' },
            { label: 'Days/Week', icon: Calendar,   key: 'days_per_week', value: member.days_per_week, step: '0.5', max: '7'  },
            { label: 'Salary',    icon: DollarSign, key: 'salary',        value: member.salary,         step: 'any', max: undefined },
          ].map(field => {
            const Icon = field.icon;
            return (
              <div key={field.key} className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                <div className="flex items-center gap-1 mb-1">
                  <Icon size={10} className="text-gray-400" />
                  <FieldLabel>{field.label}</FieldLabel>
                </div>
                <LocalInput
                  type="number"
                  step={field.step}
                  min="0"
                  max={field.max}
                  value={field.value}
                  onChange={val => onUpdate(member.id, field.key, val)}
                  className="w-full text-sm font-semibold text-gray-800 bg-transparent border-0 outline-none focus:ring-0 p-0 placeholder-gray-300"
                />
              </div>
            );
          })}

          <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
            <FieldLabel>Currency</FieldLabel>
            <select
              value={member.salary_currency}
              onChange={e => onUpdate(member.id, 'salary_currency', e.target.value)}
              className="mt-1 w-full text-sm font-semibold text-gray-800 bg-transparent border-0 outline-none focus:ring-0 p-0 cursor-pointer"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Skills */}
        <div className="mt-3">
          <div className="flex items-center gap-1 mb-1">
            <Star size={10} className="text-gray-400" />
            <FieldLabel>Main Skills</FieldLabel>
          </div>
          <LocalInput
            value={member.main_skills}
            onChange={val => onUpdate(member.id, 'main_skills', val)}
            placeholder="e.g. SEO, Copywriting, Data Analysis"
            className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder-gray-300"
          />
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-4 space-y-3">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-lg bg-green-50 flex items-center justify-center">
                  <ThumbsUp size={10} className="text-green-500" />
                </div>
                <FieldLabel>Tasks They Love</FieldLabel>
              </div>
              <LocalTextarea
                value={member.tasks_love}
                onChange={val => onUpdate(member.id, 'tasks_love', val)}
                placeholder="Describe tasks they enjoy..."
                rows={3}
                className="w-full text-sm text-gray-700 bg-transparent border-0 outline-none focus:ring-0 p-0 resize-none placeholder-gray-300"
              />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-lg bg-red-50 flex items-center justify-center">
                  <ThumbsDown size={10} className="text-red-400" />
                </div>
                <FieldLabel>Tasks They Dislike</FieldLabel>
              </div>
              <LocalTextarea
                value={member.tasks_hate}
                onChange={val => onUpdate(member.id, 'tasks_hate', val)}
                placeholder="Describe tasks they dislike..."
                rows={3}
                className="w-full text-sm text-gray-700 bg-transparent border-0 outline-none focus:ring-0 p-0 resize-none placeholder-gray-300"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-center gap-3 mb-2">
              <FieldLabel>Bonus Structure</FieldLabel>
              <button
                onClick={() => onUpdate(member.id, 'bonus_structure', !member.bonus_structure)}
                className={`relative w-7 h-3.5 rounded-full transition-colors ${member.bonus_structure ? 'bg-green-400' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-2.5 h-2.5 bg-white rounded-full shadow transition-transform ${member.bonus_structure ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
              </button>
              {member.bonus_structure && <span className="text-[11px] text-green-600 font-semibold">Eligible</span>}
            </div>
            {member.bonus_structure && (
              <LocalTextarea
                value={member.bonus_details}
                onChange={val => onUpdate(member.id, 'bonus_details', val)}
                placeholder="Describe the bonus structure, conditions, amounts..."
                rows={2}
                className="w-full text-sm text-gray-700 bg-transparent border-0 outline-none focus:ring-0 p-0 resize-none placeholder-gray-300"
              />
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-lg bg-blue-50 flex items-center justify-center">
                <Briefcase size={10} className="text-blue-500" />
              </div>
              <FieldLabel>Assigned Projects</FieldLabel>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allProjects.map(project => {
                const active = selectedProjects.includes(project.id);
                return (
                  <button
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-500'
                    }`}
                  >
                    {project.name}
                  </button>
                );
              })}
            </div>
            {selectedProjects.length > 0 && (
              <p className="mt-2 text-[11px] text-gray-400">
                {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} assigned
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-lg bg-gray-100 flex items-center justify-center">
                <StickyNote size={10} className="text-gray-500" />
              </div>
              <FieldLabel>Notes</FieldLabel>
            </div>
            <LocalTextarea
              value={member.notes}
              onChange={val => onUpdate(member.id, 'notes', val)}
              placeholder="Additional notes about this person..."
              rows={2}
              className="w-full text-sm text-gray-700 bg-transparent border-0 outline-none focus:ring-0 p-0 resize-none placeholder-gray-300"
            />
          </div>
        </div>
      )}
    </div>
  );
});

export default function DepartmentTeamSection({ departmentId }: DepartmentTeamSectionProps) {
  const { profile } = useAuth();
  const { data, loading, setData, refetch } = useRealtimeTable<DepartmentTeamMember>(
    'department_team_members',
    { column: 'department_id', value: departmentId }
  );

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [teamOptions, setTeamOptions] = useState<TeamMemberOption[]>([]);

  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.ok ? res.json() : [])
      .then((depts: { id: string; name: string }[]) => {
        setAllProjects(
          depts.filter(d => d.id !== 'dashboard' && d.id !== 'admin')
            .map(d => ({ id: d.id, name: d.name }))
        );
      })
      .catch(() => setAllProjects([]));
  }, []);

  useEffect(() => {
    const load = () => {
      fetch('/api/team-members')
        .then(res => res.ok ? res.json() : [])
        .then((members: TeamMemberOption[]) => {
          setTeamOptions(members.filter(m => m.name).sort((a, b) => a.name.localeCompare(b.name)));
        })
        .catch(() => setTeamOptions([]));
    };
    load();
    window.addEventListener('team-members-updated', load);
    return () => window.removeEventListener('team-members-updated', load);
  }, []);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('department-team-members-updated', handler);
    return () => window.removeEventListener('department-team-members-updated', handler);
  }, [refetch]);

  const sorted = [...data].sort((a, b) => {
    if (a.in_charge && !b.in_charge) return -1;
    if (!a.in_charge && b.in_charge) return 1;
    return a.sort_order - b.sort_order;
  });

  const handleAdd = useCallback(async () => {
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId, department_id: departmentId, name: '', in_charge: false,
      reports_to: '', hours_per_day: 8, days_per_week: 5, main_skills: '',
      tasks_love: '', tasks_hate: '', salary: 0, salary_currency: 'USD',
      bonus_structure: false, bonus_details: '', assigned_projects: '',
      notes: '', sort_order: data.length, created_by: profile?.id ?? null,
    } as DepartmentTeamMember;

    setData(prev => [...prev, optimistic]);

    const res = await fetch('/api/department-team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_id: departmentId, name: '', in_charge: false, reports_to: '',
        hours_per_day: 8, days_per_week: 5, main_skills: '', tasks_love: '',
        tasks_hate: '', salary: 0, salary_currency: 'USD', bonus_structure: false,
        bonus_details: '', assigned_projects: '', notes: '',
        sort_order: data.length, created_by: profile?.id ?? null,
      }),
    });

    if (res.ok) {
      const inserted = await res.json();
      setData(prev => prev.map(row => row.id === tempId ? inserted : row));
    } else {
      setData(prev => prev.filter(row => row.id !== tempId));
      await refetch();
    }
  }, [departmentId, data.length, profile?.id, setData, refetch]);

  const handleUpdate = useCallback((id: string, key: string, value: string | number | boolean) => {
    if (id.startsWith('temp-')) return;
    setData(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
    fetch(`/api/department-team-members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    }).catch(() => refetch());
  }, [setData, refetch]);

  const handleDelete = useCallback(async (id: string) => {
    const member = data.find(m => m.id === id);
    setData(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/department-team-members/${id}`, { method: 'DELETE' });

    if (member?.name) {
      const res = await fetch(`/api/team-members?name=${encodeURIComponent(member.name)}`);
      if (res.ok) {
        const teamMember = await res.json();
        if (teamMember) {
          const updatedDepts = (teamMember.departments || '')
            .split(',').map((d: string) => d.trim())
            .filter((d: string) => d && d !== departmentId).join(',');
          await fetch(`/api/team-members/${teamMember.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ departments: updatedDepts }),
          });
          window.dispatchEvent(new CustomEvent('team-members-updated'));
        }
      }
    }
  }, [data, setData, departmentId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users size={15} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Department Team</h3>
            <p className="text-[11px] text-gray-400">
              {sorted.length} member{sorted.length !== 1 ? 's' : ''} · expand to see details
            </p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#3b82f6] text-white text-xs font-semibold rounded-xl hover:bg-[#2563eb] transition-colors shadow-sm"
        >
          <Plus size={13} />
          Add Member
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Users size={22} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm font-medium mb-1">No team members yet</p>
          <p className="text-gray-300 text-xs mb-4">Add your first member to this department</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] transition-colors"
          >
            <Plus size={14} />
            Add First Member
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((member, index) => (
            <MemberCard
              key={member.id}
              member={member}
              index={index}
              allProjects={allProjects}
              teamOptions={teamOptions}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}