// 'use client';

// import { useCallback } from 'react';
// import { supabase } from '@/lib/supabase';
// import { useRealtimeTable } from '@/lib/realtime';
// import SpreadsheetTable from './SpreadsheetTable';
// import type { TeamMember, ColumnDef } from '@/lib/types';

// const columns: ColumnDef[] = [
//   { key: 'name', label: 'Name', type: 'text', width: '150px' },
//   { key: 'role', label: 'Role', type: 'text', width: '130px' },
//   { key: 'email', label: 'Email', type: 'text', width: '200px' },
//   { key: 'departments', label: 'Departments', type: 'text', width: '240px' },
//   { key: 'profit_pct', label: 'Profit %', type: 'number', width: '100px' },
//   { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'], width: '110px' },
// ];

// export default function TeamView() {
//   const { data, loading } = useRealtimeTable<TeamMember>('team_members');

//   const totalProfitPct = data.reduce((sum, m) => sum + (Number(m.profit_pct) || 0), 0);
//   const isExact100 = Math.abs(totalProfitPct - 100) < 0.01;

//   const handleAdd = useCallback(async () => {
//     await supabase.from('team_members').insert({
//       name: '',
//       role: '',
//       email: '',
//       departments: '',
//       profit_pct: 0,
//       status: 'Active',
//     });
//   }, []);

//   const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
//     await supabase.from('team_members').update({ [key]: value }).eq('id', id);
//   }, []);

//   const handleDelete = useCallback(async (id: string) => {
//     await supabase.from('team_members').delete().eq('id', id);
//   }, []);

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-sm font-medium text-gray-500">Manage team members and department assignments</h3>
//         <div className={`text-sm font-bold ${isExact100 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
//           Total Profit Split: {totalProfitPct.toFixed(1)}%
//           {!isExact100 && <span className="text-xs font-normal ml-1">(should be 100%)</span>}
//         </div>
//       </div>
//       <SpreadsheetTable
//         columns={columns}
//         data={data}
//         onAdd={handleAdd}
//         onUpdate={handleUpdate}
//         onDelete={handleDelete}
//         addLabel="Add Team Member"
//         loading={loading}
//       />
//     </div>
//   );
// }




// 'use client';

// import { useCallback } from 'react';
// import { supabase } from '@/lib/supabase';
// import { useRealtimeTable } from '@/lib/realtime';
// import SpreadsheetTable from './SpreadsheetTable';
// import type { TeamMember, ColumnDef } from '@/lib/types';

// const columns: ColumnDef[] = [
//   { key: 'name', label: 'Name', type: 'text', width: '150px' },
//   { key: 'role', label: 'Role', type: 'text', width: '130px' },
//   { key: 'email', label: 'Email', type: 'text', width: '200px' },
//   { key: 'departments', label: 'Departments', type: 'text', width: '240px' },
//   { key: 'profit_pct', label: 'Profit %', type: 'number', width: '100px' },
//   { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'], width: '110px' },
// ];

// export default function TeamView() {
//   const { data, loading } = useRealtimeTable<TeamMember>('team_members');

//   const totalProfitPct = data.reduce((sum, m) => sum + (Number(m.profit_pct) || 0), 0);
//   const isExact100 = Math.abs(totalProfitPct - 100) < 0.01;

//   const handleAdd = useCallback(async () => {
//     await supabase.from('team_members').insert({
//       name: '',
//       role: '',
//       email: '',
//       departments: '',
//       profit_pct: 0,
//       status: 'Active',
//     });
//   }, []);

// const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
//   console.log('handleUpdate fired', key, value);
//   await supabase.from('team_members').update({ [key]: value }).eq('id', id);
// }, []);

//   const handleDelete = useCallback(async (id: string) => {
//     await supabase.from('team_members').delete().eq('id', id);
//   }, []);

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="text-sm font-medium text-gray-500">Manage team members and department assignments</h3>
//         <div className={`text-sm font-bold ${isExact100 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
//           Total Profit Split: {totalProfitPct.toFixed(1)}%
//           {!isExact100 && <span className="text-xs font-normal ml-1">(should be 100%)</span>}
//         </div>
//       </div>
//       <SpreadsheetTable
//         columns={columns}
//         data={data}
//         onAdd={handleAdd}
//         onUpdate={handleUpdate}
//         onDelete={handleDelete}
//         addLabel="Add Team Member"
//         loading={loading}
//       />
//     </div>
//   );
// }



'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, X, Plus, Trash2, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from '@/lib/realtime';
import { DEPARTMENTS } from '@/lib/departments';
import type { TeamMember } from '@/lib/types';

const ROLE_OPTIONS = ['Lead', 'Manager', 'Member'];

const ROLE_STYLES: Record<string, string> = {
  Lead: 'bg-amber-50 text-amber-700 border-amber-200',
  Manager: 'bg-blue-50 text-blue-700 border-blue-200',
  Member: 'bg-gray-50 text-gray-600 border-gray-200',
};

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
  Inactive: 'bg-red-50 text-red-600 border-red-200',
};

const DEPT_OPTIONS = DEPARTMENTS
  .filter(d => d.id !== 'dashboard' && d.id !== 'admin')
  .map(d => ({ id: d.id, name: d.name }));

async function syncMemberToDepartments(name: string, role: string, departments: string) {
  const deptIds = departments.split(',').map(d => d.trim()).filter(Boolean);
  for (const deptId of deptIds) {
    const { data: existing } = await supabase
      .from('department_team_members')
      .select('id')
      .eq('department_id', deptId)
      .eq('name', name)
      .maybeSingle();

    if (!existing) {
      await supabase.from('department_team_members').insert({
        department_id: deptId,
        name,
        in_charge: role === 'Lead',
        reports_to: '',
        hours_per_day: 8,
        days_per_week: 5,
        main_skills: '',
        tasks_love: '',
        tasks_hate: '',
        salary: 0,
        salary_currency: 'USD',
        bonus_structure: false,
        bonus_details: '',
        assigned_projects: '',
        notes: '',
        sort_order: 0,
      });
    }
  }
}

function MultiSelectDept({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle(id: string) {
    const updated = selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id];
    onChange(updated.join(','));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-sm rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all text-left min-h-[36px]"
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-gray-300 text-xs italic">Assign departments…</span>
          ) : (
            selected.map(id => {
              const dept = DEPT_OPTIONS.find(d => d.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                  {dept?.name || id}
                  <span role="button" onClick={e => { e.stopPropagation(); toggle(id); }} className="hover:text-blue-900 cursor-pointer ml-0.5">
                    <X size={9} />
                  </span>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown size={12} className={`shrink-0 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl shadow-gray-100 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Assign to Departments</p>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {DEPT_OPTIONS.map(dept => {
              const active = selected.includes(dept.id);
              return (
                <button
                  key={dept.id}
                  onClick={() => toggle(dept.id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                    active ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {active && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className="truncate">{dept.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function InlineInput({
  value,
  onCommit,
  placeholder,
  type = 'text',
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
      className="w-full px-2.5 py-1.5 text-sm bg-transparent border border-transparent rounded-lg hover:border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-50 outline-none transition-all placeholder-gray-300"
    />
  );
}

export default function TeamView() {
  const { data, loading, setData, refetch } = useRealtimeTable<TeamMember>('team_members');

  const activeCount = data.filter(m => m.status === 'Active').length;
  const leadCount = data.filter(m => m.role === 'Lead').length;

  const handleAdd = useCallback(async () => {
    const { data: inserted } = await supabase
      .from('team_members')
      .insert({ name: '', role: 'Member', email: '', departments: '', profit_pct: 0, status: 'Active' })
      .select()
      .single();

    if (inserted) {
      setData(prev => [...prev, inserted]);
    } else {
      await refetch();
    }
  }, [setData, refetch]);

  const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
    await supabase.from('team_members').update({ [key]: value }).eq('id', id);

    if (key === 'name') {
      const member = data.find(m => m.id === id);
      const oldName = member?.name;
      const newName = String(value);
      if (oldName && oldName !== newName && member?.departments) {
        const deptIds = member.departments.split(',').map(d => d.trim()).filter(Boolean);
        for (const deptId of deptIds) {
          await supabase
            .from('department_team_members')
            .update({ name: newName })
            .eq('department_id', deptId)
            .eq('name', oldName);
        }
      }
    }

    if (key === 'departments' || key === 'role') {
      const { data: fresh } = await supabase
        .from('team_members')
        .select('name, role, departments')
        .eq('id', id)
        .single();

      if (!fresh?.name) return;

      if (key === 'departments') {
        await syncMemberToDepartments(fresh.name, fresh.role || '', String(value));
      }

      if (key === 'role') {
        const deptIds = (fresh.departments || '')
          .split(',').map((d: string) => d.trim()).filter(Boolean);
        for (const deptId of deptIds) {
          await supabase
            .from('department_team_members')
            .update({ in_charge: value === 'Lead' })
            .eq('department_id', deptId)
            .eq('name', fresh.name);
        }
      }
    }
  }, [data]);

const handleDelete = useCallback(async (id: string) => {
  await supabase.from('department_team_members').delete().eq('id', id);
  setData(prev => prev.filter(row => row.id !== id));
}, [setData]);


  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-xs font-medium text-gray-500">Total</span>
          <span className="text-sm font-bold text-gray-900">{data.length}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
          <span className="text-xs font-medium text-emerald-600">Active</span>
          <span className="text-sm font-bold text-emerald-700">{activeCount}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
          <span className="text-xs font-medium text-amber-600">Leads</span>
          <span className="text-sm font-bold text-amber-700">{leadCount}</span>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '160px' }}>Name</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '120px' }}>Role</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '200px' }}>Email</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '120px' }}>Status</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '280px' }}>Departments</th>
              <th className="w-12 bg-gray-50" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <UserCircle size={32} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400 mb-4">No team members yet.</p>
                  <button
                    onClick={handleAdd}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors"
                  >
                    <Plus size={14} />
                    Add First Member
                  </button>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`group transition-colors hover:bg-blue-50/30 ${idx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}
                >
                  {/* Name */}
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
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
                  <td className="px-2 py-1">
                    <select
                      value={String(row.role ?? 'Member')}
                      onChange={e => handleUpdate(row.id, 'role', e.target.value)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 transition-all ${ROLE_STYLES[row.role] || ROLE_STYLES.Member}`}
                    >
                      {ROLE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>

                  {/* Email */}
                  <td className="px-2 py-1">
                    <InlineInput
                      value={row.email}
                      onCommit={val => handleUpdate(row.id, 'email', val)}
                      placeholder="email@example.com"
                    />
                  </td>

                  {/* Status */}
                  <td className="px-2 py-1">
                    <select
                      value={String(row.status ?? 'Active')}
                      onChange={e => handleUpdate(row.id, 'status', e.target.value)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 transition-all ${STATUS_STYLES[row.status] || STATUS_STYLES.Active}`}
                    >
                      {['Active', 'On Leave', 'Inactive'].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>

                  {/* Departments */}
                  <td className="px-2 py-1">
                    <MultiSelectDept
                      value={row.departments || ''}
                      onChange={val => handleUpdate(row.id, 'departments', val)}
                    />
                  </td>

                  {/* Delete */}
                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="p-1.5 rounded-lg text-gray-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleAdd}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm"
      >
        <Plus size={14} />
        Add Team Member
      </button>
    </div>
  );
}