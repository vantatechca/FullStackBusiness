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
import { ChevronDown, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from '@/lib/realtime';
import { DEPARTMENTS } from '@/lib/departments';
import type { TeamMember } from '@/lib/types';

const ROLE_OPTIONS = ['Lead', 'Manager', 'Member'];

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

function MultiSelectDept({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
        className="w-full flex items-center justify-between gap-1 px-2 py-1.5 text-sm rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left"
      >
        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-gray-300 text-xs">Select departments</span>
          ) : (
            selected.map(id => {
              const dept = DEPT_OPTIONS.find(d => d.id === id);
              return (
                <span key={id} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] bg-blue-50 text-blue-700 border border-blue-100">
                  {dept?.name || id}
                  <span
                    role="button"
                    onClick={e => { e.stopPropagation(); toggle(id); }}
                    className="hover:text-blue-900 cursor-pointer"
                  >
                    <X size={10} />
                  </span>
                </span>
              );
            })
          )}
        </div>
        <ChevronDown size={12} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto p-1.5">
            {DEPT_OPTIONS.map(dept => {
              const active = selected.includes(dept.id);
              return (
                <button
                  key={dept.id}
                  onClick={() => toggle(dept.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                    active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    active ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {active && <Check size={10} className="text-white" />}
                  </div>
                  {dept.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const TABLE_COLUMNS = [
  { key: 'name', label: 'Name', width: '150px', type: 'text' },
  { key: 'role', label: 'Role', width: '120px', type: 'role-select' },
  { key: 'email', label: 'Email', width: '200px', type: 'text' },
  { key: 'profit_pct', label: 'Profit %', width: '90px', type: 'number' },
  { key: 'status', label: 'Status', width: '110px', type: 'status-select' },
];

export default function TeamView() {
  const { data, loading, setData, refetch } = useRealtimeTable<TeamMember>('team_members');

  const totalProfitPct = data.reduce((sum, m) => sum + (Number(m.profit_pct) || 0), 0);
  const isExact100 = Math.abs(totalProfitPct - 100) < 0.01;

  const handleAdd = useCallback(async () => {
    const { data: inserted } = await supabase
      .from('team_members')
      .insert({
        name: '',
        role: 'Member',
        email: '',
        departments: '',
        profit_pct: 0,
        status: 'Active',
      })
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

    const member = data.find(m => m.id === id);
    if (!member) return;

    if (key === 'name') {
      const oldName = member.name;
      const newName = String(value);
      if (oldName && oldName !== newName && member.departments) {
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

    if (key === 'departments') {
      if (!member.name) return;
      await syncMemberToDepartments(member.name, member.role || '', String(value));
    }

    if (key === 'role' && member.departments) {
      const deptIds = member.departments.split(',').map(d => d.trim()).filter(Boolean);
      for (const deptId of deptIds) {
        await supabase
          .from('department_team_members')
          .update({ in_charge: value === 'Lead' })
          .eq('department_id', deptId)
          .eq('name', member.name);
      }
    }
  }, [data]);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id);
  }, []);

  if (loading) {
    return <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">Manage team members and department assignments</h3>
        <div className={`text-sm font-bold ${isExact100 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
          Total Profit Split: {totalProfitPct.toFixed(1)}%
          {!isExact100 && <span className="text-xs font-normal ml-1">(should be 100%)</span>}
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              {TABLE_COLUMNS.map(col => (
                <th key={col.key} className="text-left text-[11px] font-bold text-[#475569] uppercase tracking-wider px-3 py-2.5 bg-gray-50/80" style={{ minWidth: col.width }}>
                  {col.label}
                </th>
              ))}
              <th className="text-left text-[11px] font-bold text-[#475569] uppercase tracking-wider px-3 py-2.5 bg-gray-50/80" style={{ minWidth: '260px' }}>
                Departments
              </th>
              <th className="w-10 bg-gray-50/80" />
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 2} className="px-3 py-8 text-center text-sm text-gray-400">
                  No team members yet. Click &quot;Add Team Member&quot; to start.
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={row.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'} hover:bg-blue-50/30 transition-colors`}>
                  {TABLE_COLUMNS.map(col => (
                    <td key={col.key} className="px-1.5 py-1">
                      {col.type === 'role-select' ? (
                        <select
                          value={String(row.role ?? 'Member')}
                          onChange={e => handleUpdate(row.id, 'role', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
                        >
                          {ROLE_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : col.type === 'status-select' ? (
                        <select
                          value={String(row.status ?? 'Active')}
                          onChange={e => handleUpdate(row.id, 'status', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
                        >
                          {['Active', 'On Leave', 'Inactive'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={col.type === 'number' ? 'number' : 'text'}
                          defaultValue={String(row[col.key as keyof TeamMember] ?? '')}
                          onBlur={e => handleUpdate(row.id, col.key, col.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none"
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-1.5 py-1">
                    <MultiSelectDept
                      value={row.departments || ''}
                      onChange={val => handleUpdate(row.id, 'departments', val)}
                    />
                  </td>
                  <td className="px-1.5 py-1 text-center">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors text-base leading-none"
                    >
                      ×
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
        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors"
      >
        + Add Team Member
      </button>
    </div>
  );
}