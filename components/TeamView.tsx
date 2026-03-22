
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Check, X, Plus, Trash2, UserCircle, Building2, Search, Users, Star, Activity } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useRealtimeTable } from '@/lib/realtime';
import { DEPARTMENT_ICONS } from '@/lib/departments';
import type { TeamMember } from '@/lib/types';

const ROLE_OPTIONS = ['Lead', 'Manager', 'Member'];

const ROLE_CONFIG: Record<string, { style: string; dot: string }> = {
  Lead:    { style: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  Manager: { style: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-400' },
  Member:  { style: 'bg-gray-50 text-gray-600 border-gray-200',      dot: 'bg-gray-400' },
};

const STATUS_CONFIG: Record<string, { style: string; dot: string }> = {
  Active:    { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  'On Leave':{ style: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400' },
  Inactive:  { style: 'bg-red-50 text-red-600 border-red-200',             dot: 'bg-red-400' },
};



// Soft avatar colors cycling by index
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

interface DeptOption {
  id: string;
  name: string;
  icon: string;
}

async function syncMemberToDepartments(name: string, departments: string) {
  await fetch('/api/department-team-members/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, departments }),
  });
}

// ── Department Modal ──────────────────────────────────────────────────────────
function DeptModal({
  memberName, value, deptOptions, onSave, onClose,
}: {
  memberName: string;
  value: string;
  deptOptions: DeptOption[];
  onSave: (val: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(
    value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }

  function handleSave() {
    onSave(selected.join(','));
    onClose();
  }

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={16} className="text-[#3b82f6]" />
                <h2 className="text-base font-semibold text-gray-900">Assign Departments</h2>
              </div>
              <p className="text-sm text-gray-400">
                {memberName
                  ? <>Selecting for <span className="font-medium text-gray-600">{memberName}</span></>
                  : 'Select departments for this member'}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
          </div>
          {selected.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.map(id => {
                const dept = deptOptions.find(d => d.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {dept?.name || id}
                    <button onClick={() => toggle(id)} className="hover:text-blue-900"><X size={9} /></button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="max-h-72 overflow-y-auto p-3">
          <div className="grid grid-cols-1 gap-1">
            {deptOptions.map(dept => {
              const active = selected.includes(dept.id);
              const Icon = DEPARTMENT_ICONS[dept.icon];
              return (
                <button
                  key={dept.id}
                  onClick={() => toggle(dept.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    active
                      ? 'bg-blue-50 border border-blue-200 text-blue-700'
                      : 'border border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-blue-500' : 'bg-gray-100'}`}>
                    {Icon
                      ? <Icon size={14} className={active ? 'text-white' : 'text-gray-500'} />
                      : <Building2 size={14} className={active ? 'text-white' : 'text-gray-500'} />
                    }
                  </div>
                  <span className="flex-1 text-left font-medium">{dept.name}</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${active ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                    {active && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
          <p className="text-xs text-gray-400">
            {selected.length === 0
              ? 'No departments selected'
              : `${selected.length} department${selected.length !== 1 ? 's' : ''} selected`}
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-1.5 text-sm font-medium bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
}

// ── Dept Cell ─────────────────────────────────────────────────────────────────
function DeptCell({
  memberId, memberName, value, deptOptions, onUpdate,
}: {
  memberId: string;
  memberName: string;
  value: string;
  deptOptions: DeptOption[];
  onUpdate: (id: string, key: string, val: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all text-left min-h-[36px]"
      >
        {selected.length === 0 ? (
          <span className="text-gray-300 text-xs italic flex items-center gap-1">
            <Plus size={11} />Assign…
          </span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {selected.slice(0, 2).map(id => {
              const dept = deptOptions.find(d => d.id === id);
              return (
                <span key={id} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {dept?.name || id}
                </span>
              );
            })}
            {selected.length > 2 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                +{selected.length - 2}
              </span>
            )}
          </div>
        )}
      </button>
      {modalOpen && (
        <DeptModal
          memberName={memberName}
          value={value}
          deptOptions={deptOptions}
          onSave={val => onUpdate(memberId, 'departments', val)}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ── Inline Input ──────────────────────────────────────────────────────────────
function InlineInput({
  value, onCommit, placeholder, type = 'text',
}: {
  value: string | number;
  onCommit: (val: string | number) => void;
  placeholder?: string;
  type?: 'text' | 'number';
}) {
  return (
    <input
      type={type}
      defaultValue={String(value ?? '')}
      placeholder={placeholder}
      onBlur={e => onCommit(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
      className="w-full px-2 py-1.5 text-sm bg-transparent border border-transparent rounded-lg hover:border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-50 outline-none transition-all placeholder-gray-300"
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TeamView() {
  const { data, loading, setData, refetch } = useRealtimeTable<TeamMember>('team_members');
  const [search, setSearch] = useState('');
  const [deptOptions, setDeptOptions] = useState<DeptOption[]>([]);

  useEffect(() => {
    fetch('/api/departments')
      .then(r => r.json())
      .then((depts: DeptOption[]) => {
        setDeptOptions(depts.filter(d => d.id !== 'dashboard' && d.id !== 'admin'));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('team-members-updated', handler);
    return () => window.removeEventListener('team-members-updated', handler);
  }, [refetch]);

  const filtered = search.trim()
    ? data.filter(m => {
        const q = search.toLowerCase();
        return (
          m.name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.role?.toLowerCase().includes(q) ||
          m.status?.toLowerCase().includes(q) ||
          m.departments?.toLowerCase().includes(q)
        );
      })
    : data;

  const activeCount   = data.filter(m => m.status === 'Active').length;
  const leadCount     = data.filter(m => m.role === 'Lead').length;
  const onLeaveCount  = data.filter(m => m.status === 'On Leave').length;

  const handleAdd = useCallback(async () => {
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId, name: '', role: 'Member', email: '',
      departments: '', profit_pct: 0, status: 'Active',
    } as TeamMember;
    setData(prev => [...prev, optimistic]);

    const res = await fetch('/api/team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', role: 'Member', email: '', departments: '', profit_pct: 0, status: 'Active' }),
    });
    if (res.ok) {
      const inserted = await res.json();
      setData(prev => prev.map(m => m.id === tempId ? inserted : m));
    } else {
      setData(prev => prev.filter(m => m.id !== tempId));
      await refetch();
    }
  }, [setData, refetch]);

  const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
    const member = data.find(m => m.id === id);
    setData(prev => prev.map(m => m.id === id ? { ...m, [key]: value } : m));

    await fetch(`/api/team-members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });

    if (key === 'name') {
      const oldName = member?.name;
      const newName = String(value);
      if (oldName && oldName !== newName && member?.departments) {
        await fetch('/api/department-team-members/rename', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldName, newName, departments: member.departments }),
        });
      }
    }

    if (key === 'departments') {
      if (!member?.name) return;
      await syncMemberToDepartments(member.name, String(value));
      window.dispatchEvent(new CustomEvent('department-team-members-updated'));
    }

    if (key === 'role') {
      window.dispatchEvent(new CustomEvent('department-team-members-updated'));
    }
  }, [data, setData]);

  const handleDelete = useCallback(async (id: string) => {
    const member = data.find(m => m.id === id);
    setData(prev => prev.filter(row => row.id !== id));
    await fetch(`/api/team-members/${id}`, { method: 'DELETE' });

    if (member?.name && member?.departments) {
      const deptIds = member.departments.split(',').map(d => d.trim()).filter(Boolean);
      await Promise.all(
        deptIds.map(async deptId => {
          const res = await fetch(
            `/api/department-team-members?name=${encodeURIComponent(member.name)}&department_id=${encodeURIComponent(deptId)}`
          );
          if (!res.ok) return;
          const row = await res.json();
          if (row?.id) await fetch(`/api/department-team-members/${row.id}`, { method: 'DELETE' });
        })
      );
      window.dispatchEvent(new CustomEvent('department-team-members-updated'));
    }
  }, [data, setData]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: data.length,   icon: Users,    color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100' },
          { label: 'Active',        value: activeCount,   icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Leads',         value: leadCount,     icon: Star,     color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100' },
          { label: 'On Leave',      value: onLeaveCount,  icon: UserCircle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${stat.border} ${stat.bg}`}>
              <div className={`w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon size={15} className={stat.color} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-none">{stat.value}</p>
                <p className={`text-[11px] font-medium mt-0.5 ${stat.color}`}>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all w-56 shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] transition-colors shadow-sm"
        >
          <Plus size={15} />
          Add Member
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/80">
              <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '200px' }}>Member</th>
              <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3" style={{ minWidth: '120px' }}>Role</th>
              <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3" style={{ minWidth: '200px' }}>Email</th>
              <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3" style={{ minWidth: '120px' }}>Status</th>
              <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-3" style={{ minWidth: '220px' }}>Departments</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <UserCircle size={28} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    {search ? `No members matching "${search}"` : 'No team members yet'}
                  </p>
                  <p className="text-xs text-gray-300 mb-5">
                    {search ? 'Try a different search term' : 'Add your first team member to get started'}
                  </p>
                  {!search && (
                    <button
                      onClick={handleAdd}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] transition-colors"
                    >
                      <Plus size={14} />
                      Add First Member
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => {
                const roleConfig   = ROLE_CONFIG[row.role]   ?? ROLE_CONFIG.Member;
                const statusConfig = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.Active;
                const avatarColor  = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                return (
                  <tr
                    key={row.id}
                    className={`group border-b border-gray-50 last:border-b-0 transition-colors hover:bg-blue-50/20 ${
                      idx % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'
                    }`}
                  >
                    {/* Member name + avatar */}
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                          {String(row.name || '?')[0].toUpperCase()}
                        </div>
                        <InlineInput
                          value={row.name}
                          onCommit={val => handleUpdate(row.id, 'name', val)}
                          placeholder="Full name"
                        />
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-3 py-2">
                      <div className="relative inline-flex items-center">
                        <span className={`absolute left-2 w-1.5 h-1.5 rounded-full ${roleConfig.dot}`} />
                        <select
                          value={String(row.role ?? 'Member')}
                          onChange={e => handleUpdate(row.id, 'role', e.target.value)}
                          className={`pl-5 pr-2.5 py-1 text-xs font-semibold rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none ${roleConfig.style}`}
                        >
                          {ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-3 py-2">
                      <InlineInput
                        value={row.email}
                        onCommit={val => handleUpdate(row.id, 'email', val)}
                        placeholder="email@example.com"
                      />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2">
                      <div className="relative inline-flex items-center">
                        <span className={`absolute left-2 w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        <select
                          value={String(row.status ?? 'Active')}
                          onChange={e => handleUpdate(row.id, 'status', e.target.value)}
                          className={`pl-5 pr-2.5 py-1 text-xs font-semibold rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none ${statusConfig.style}`}
                        >
                          {['Active', 'On Leave', 'Inactive'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </td>

                    {/* Departments */}
                    <td className="px-3 py-2">
                      <DeptCell
                        memberId={row.id}
                        memberName={row.name}
                        value={row.departments || ''}
                        deptOptions={deptOptions}
                        onUpdate={handleUpdate}
                      />
                    </td>

                    {/* Delete */}
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 rounded-lg text-gray-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}