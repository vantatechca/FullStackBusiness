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

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from '@/lib/realtime';
import SpreadsheetTable from './SpreadsheetTable';
import type { TeamMember, ColumnDef } from '@/lib/types';

const columns: ColumnDef[] = [
  { key: 'name', label: 'Name', type: 'text', width: '150px' },
  { key: 'role', label: 'Role', type: 'text', width: '130px' },
  { key: 'email', label: 'Email', type: 'text', width: '200px' },
  { key: 'departments', label: 'Departments', type: 'text', width: '240px' },
  { key: 'profit_pct', label: 'Profit %', type: 'number', width: '100px' },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'], width: '110px' },
];

async function syncMemberToDepartments(
  name: string,
  role: string,
  departments: string
) {
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
        in_charge: false,
        reports_to: '',
        hours_per_day: 8,
        days_per_week: 5,
        main_skills: role || '',
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

export default function TeamView() {
  const { data, loading, refetch } = useRealtimeTable<TeamMember>('team_members');

  const totalProfitPct = data.reduce((sum, m) => sum + (Number(m.profit_pct) || 0), 0);
  const isExact100 = Math.abs(totalProfitPct - 100) < 0.01;

  const handleAdd = useCallback(async () => {
    await supabase.from('team_members').insert({
      name: '',
      role: '',
      email: '',
      departments: '',
      profit_pct: 0,
      status: 'Active',
    });
    await refetch();
  }, [refetch]);

  const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
    await supabase.from('team_members').update({ [key]: value }).eq('id', id);

    const member = data.find(m => m.id === id);
    if (!member) return;

    // When name changes, update existing department_team_members records
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

    // When departments changes, auto-create records in department_team_members
    if (key === 'departments') {
      const memberName = member.name;
      if (!memberName) return; // skip if name not set yet
      await syncMemberToDepartments(memberName, member.role || '', String(value));
    }
  }, [data]);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">Manage team members and department assignments</h3>
        <div className={`text-sm font-bold ${isExact100 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
          Total Profit Split: {totalProfitPct.toFixed(1)}%
          {!isExact100 && <span className="text-xs font-normal ml-1">(should be 100%)</span>}
        </div>
      </div>
      <SpreadsheetTable
        columns={columns}
        data={data}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        addLabel="Add Team Member"
        loading={loading}
      />
    </div>
  );
}