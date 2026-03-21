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






// 'use client';

// import { useState, useCallback, useEffect } from 'react';
// import { Check, X, Plus, Trash2, UserCircle, Building2 } from 'lucide-react';
// import { createPortal } from 'react-dom';
// import { supabase } from '@/lib/supabase';
// import { useRealtimeTable } from '@/lib/realtime';
// import { DEPARTMENT_ICONS } from '@/lib/departments';
// import type { TeamMember } from '@/lib/types';

// const ROLE_OPTIONS = ['Lead', 'Manager', 'Member'];

// const ROLE_STYLES: Record<string, string> = {
//   Lead: 'bg-amber-50 text-amber-700 border-amber-200',
//   Manager: 'bg-blue-50 text-blue-700 border-blue-200',
//   Member: 'bg-gray-50 text-gray-600 border-gray-200',
// };

// const STATUS_STYLES: Record<string, string> = {
//   Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
//   'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
//   Inactive: 'bg-red-50 text-red-600 border-red-200',
// };

// interface DeptOption {
//   id: string;
//   name: string;
//   icon: string;
// }

// async function syncMemberToDepartments(name: string, role: string, departments: string) {
//   const deptIds = departments.split(',').map(d => d.trim()).filter(Boolean);
//   for (const deptId of deptIds) {
//     const { data: existing } = await supabase
//       .from('department_team_members')
//       .select('id')
//       .eq('department_id', deptId)
//       .eq('name', name)
//       .maybeSingle();

//     if (!existing) {
//       await supabase.from('department_team_members').insert({
//         department_id: deptId,
//         name,
//         in_charge: role === 'Lead',
//         reports_to: '',
//         hours_per_day: 8,
//         days_per_week: 5,
//         main_skills: '',
//         tasks_love: '',
//         tasks_hate: '',
//         salary: 0,
//         salary_currency: 'USD',
//         bonus_structure: false,
//         bonus_details: '',
//         assigned_projects: '',
//         notes: '',
//         sort_order: 0,
//       });
//     }
//   }
// }

// // ── Department Modal ──────────────────────────────────────────────────────────
// function DeptModal({
//   memberName,
//   value,
//   deptOptions,
//   onSave,
//   onClose,
// }: {
//   memberName: string;
//   value: string;
//   deptOptions: DeptOption[];
//   onSave: (val: string) => void;
//   onClose: () => void;
// }) {
//   const [selected, setSelected] = useState<string[]>(
//     value ? value.split(',').map(s => s.trim()).filter(Boolean) : []
//   );

//   useEffect(() => {
//     const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
//     document.addEventListener('keydown', handleKey);
//     return () => document.removeEventListener('keydown', handleKey);
//   }, [onClose]);

//   function toggle(id: string) {
//     setSelected(prev =>
//       prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
//     );
//   }

//   function handleSave() {
//     onSave(selected.join(','));
//     onClose();
//   }

//   const content = (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
//       <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
//         {/* Header */}
//         <div className="px-6 pt-6 pb-4 border-b border-gray-100">
//           <div className="flex items-start justify-between">
//             <div>
//               <div className="flex items-center gap-2 mb-1">
//                 <Building2 size={16} className="text-[#3b82f6]" />
//                 <h2 className="text-base font-semibold text-gray-900">Assign Departments</h2>
//               </div>
//               <p className="text-sm text-gray-400">
//                 {memberName
//                   ? <>Selecting for <span className="font-medium text-gray-600">{memberName}</span></>
//                   : 'Select departments for this member'}
//               </p>
//             </div>
//             <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
//               <X size={16} />
//             </button>
//           </div>
//           {selected.length > 0 && (
//             <div className="mt-3 flex flex-wrap gap-1.5">
//               {selected.map(id => {
//                 const dept = deptOptions.find(d => d.id === id);
//                 return (
//                   <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
//                     {dept?.name || id}
//                     <button onClick={() => toggle(id)} className="hover:text-blue-900"><X size={9} /></button>
//                   </span>
//                 );
//               })}
//             </div>
//           )}
//         </div>

//         {/* Department list */}
//         <div className="max-h-72 overflow-y-auto p-3">
//           <div className="grid grid-cols-1 gap-1">
//             {deptOptions.map(dept => {
//               const active = selected.includes(dept.id);
//               const Icon = DEPARTMENT_ICONS[dept.icon];
//               return (
//                 <button
//                   key={dept.id}
//                   onClick={() => toggle(dept.id)}
//                   className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
//                     active
//                       ? 'bg-blue-50 border border-blue-200 text-blue-700'
//                       : 'border border-transparent text-gray-700 hover:bg-gray-50 hover:border-gray-200'
//                   }`}
//                 >
//                   <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-blue-500' : 'bg-gray-100'}`}>
//                     {Icon
//                       ? <Icon size={14} className={active ? 'text-white' : 'text-gray-500'} />
//                       : <Building2 size={14} className={active ? 'text-white' : 'text-gray-500'} />
//                     }
//                   </div>
//                   <span className="flex-1 text-left font-medium">{dept.name}</span>
//                   <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${active ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
//                     {active && <Check size={10} className="text-white" strokeWidth={3} />}
//                   </div>
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
//           <p className="text-xs text-gray-400">
//             {selected.length === 0
//               ? 'No departments selected'
//               : `${selected.length} department${selected.length !== 1 ? 's' : ''} selected`}
//           </p>
//           <div className="flex gap-2">
//             <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
//               Cancel
//             </button>
//             <button onClick={handleSave} className="px-4 py-1.5 text-sm font-medium bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors">
//               Save
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
// }

// // ── Dept Cell ─────────────────────────────────────────────────────────────────
// function DeptCell({
//   memberId, memberName, value, deptOptions, onUpdate,
// }: {
//   memberId: string;
//   memberName: string;
//   value: string;
//   deptOptions: DeptOption[];
//   onUpdate: (id: string, key: string, val: string) => void;
// }) {
//   const [modalOpen, setModalOpen] = useState(false);
//   const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

//   return (
//     <>
//       <button
//         onClick={() => setModalOpen(true)}
//         className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all text-left min-h-[36px]"
//       >
//         {selected.length === 0 ? (
//           <span className="text-gray-300 text-xs italic flex items-center gap-1">
//             <Plus size={11} />Assign…
//           </span>
//         ) : (
//           <div className="flex flex-wrap gap-1">
//             {selected.slice(0, 2).map(id => {
//               const dept = deptOptions.find(d => d.id === id);
//               return (
//                 <span key={id} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
//                   {dept?.name || id}
//                 </span>
//               );
//             })}
//             {selected.length > 2 && (
//               <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
//                 +{selected.length - 2}
//               </span>
//             )}
//           </div>
//         )}
//       </button>
//       {modalOpen && (
//         <DeptModal
//           memberName={memberName}
//           value={value}
//           deptOptions={deptOptions}
//           onSave={val => onUpdate(memberId, 'departments', val)}
//           onClose={() => setModalOpen(false)}
//         />
//       )}
//     </>
//   );
// }

// // ── Inline Input ──────────────────────────────────────────────────────────────
// function InlineInput({
//   value, onCommit, placeholder, type = 'text',
// }: {
//   value: string | number;
//   onCommit: (val: string | number) => void;
//   placeholder?: string;
//   type?: 'text' | 'number';
// }) {
//   return (
//     <input
//       type={type}
//       defaultValue={String(value ?? '')}
//       placeholder={placeholder}
//       onBlur={e => onCommit(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
//       className="w-full px-2.5 py-1.5 text-sm bg-transparent border border-transparent rounded-lg hover:border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-50 outline-none transition-all placeholder-gray-300"
//     />
//   );
// }

// // ── Main Component ────────────────────────────────────────────────────────────
// export default function TeamView() {
//   const { data, loading, setData, refetch } = useRealtimeTable<TeamMember>('team_members');
//   const [search, setSearch] = useState('');
//   const [deptOptions, setDeptOptions] = useState<DeptOption[]>([]);

//   // Fetch departments from DB (not static constant)
//   useEffect(() => {
//     supabase
//       .from('departments')
//       .select('id, name, icon')
//       .not('id', 'in', '(dashboard,admin)')
//       .order('sort_order', { ascending: true })
//       .then(({ data }) => {
//         if (data) setDeptOptions(data);
//       });
//   }, []);

//   useEffect(() => {
//     const handler = () => refetch();
//     window.addEventListener('team-members-updated', handler);
//     return () => window.removeEventListener('team-members-updated', handler);
//   }, [refetch]);

//   const filtered = search.trim()
//     ? data.filter(m => {
//         const q = search.toLowerCase();
//         return (
//           m.name?.toLowerCase().includes(q) ||
//           m.email?.toLowerCase().includes(q) ||
//           m.role?.toLowerCase().includes(q) ||
//           m.status?.toLowerCase().includes(q) ||
//           m.departments?.toLowerCase().includes(q)
//         );
//       })
//     : data;

//   const activeCount = data.filter(m => m.status === 'Active').length;
//   const leadCount = data.filter(m => m.role === 'Lead').length;

//   const handleAdd = useCallback(async () => {
//     const { data: inserted } = await supabase
//       .from('team_members')
//       .insert({ name: '', role: 'Member', email: '', departments: '', profit_pct: 0, status: 'Active' })
//       .select()
//       .single();

//     if (inserted) {
//       setData(prev => [...prev, inserted]);
//     } else {
//       await refetch();
//     }
//   }, [setData, refetch]);

//   const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
//     await supabase.from('team_members').update({ [key]: value }).eq('id', id);

//     if (key === 'name') {
//       const member = data.find(m => m.id === id);
//       const oldName = member?.name;
//       const newName = String(value);
//       if (oldName && oldName !== newName && member?.departments) {
//         const deptIds = member.departments.split(',').map(d => d.trim()).filter(Boolean);
//         for (const deptId of deptIds) {
//           await supabase
//             .from('department_team_members')
//             .update({ name: newName })
//             .eq('department_id', deptId)
//             .eq('name', oldName);
//         }
//       }
//     }

//     if (key === 'departments' || key === 'role') {
//       const { data: fresh } = await supabase
//         .from('team_members')
//         .select('name, role, departments')
//         .eq('id', id)
//         .single();

//       if (!fresh?.name) return;

//       if (key === 'departments') {
//         await syncMemberToDepartments(fresh.name, fresh.role || '', String(value));
//       }

//       if (key === 'role') {
//         const deptIds = (fresh.departments || '')
//           .split(',').map((d: string) => d.trim()).filter(Boolean);
//         for (const deptId of deptIds) {
//           await supabase
//             .from('department_team_members')
//             .update({ in_charge: value === 'Lead' })
//             .eq('department_id', deptId)
//             .eq('name', fresh.name);
//         }
//       }
//     }
//   }, [data]);

//   const handleDelete = useCallback(async (id: string) => {
//     await supabase.from('team_members').delete().eq('id', id);
//     setData(prev => prev.filter(row => row.id !== id));
//   }, [setData]);

//   if (loading) {
//     return (
//       <div className="space-y-2">
//         {[...Array(4)].map((_, i) => (
//           <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {/* Stats + Search */}
//       <div className="flex items-center justify-between gap-3 flex-wrap">
//         <div className="flex items-center gap-3">
//           <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
//             <span className="text-xs font-medium text-gray-500">Total</span>
//             <span className="text-sm font-bold text-gray-900">{data.length}</span>
//           </div>
//           <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
//             <span className="text-xs font-medium text-emerald-600">Active</span>
//             <span className="text-sm font-bold text-emerald-700">{activeCount}</span>
//           </div>
//           <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
//             <span className="text-xs font-medium text-amber-600">Leads</span>
//             <span className="text-sm font-bold text-amber-700">{leadCount}</span>
//           </div>
//         </div>

//         {/* Search */}
//         <div className="relative">
//           <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//             <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
//           </svg>
//           <input
//             type="text"
//             value={search}
//             onChange={e => setSearch(e.target.value)}
//             placeholder="Search members…"
//             className="pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all w-52"
//           />
//           {search && (
//             <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
//               <X size={13} />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Table */}
//       <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-200">
//               <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '180px' }}>Name</th>
//               <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '120px' }}>Role</th>
//               <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '200px' }}>Email</th>
//               <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '120px' }}>Status</th>
//               <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '200px' }}>Departments</th>
//               <th className="w-12 bg-gray-50" />
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-100">
//             {filtered.length === 0 ? (
//               <tr>
//                 <td colSpan={6} className="py-16 text-center">
//                   <UserCircle size={32} className="mx-auto text-gray-200 mb-3" />
//                   <p className="text-sm text-gray-400 mb-1">
//                     {search ? `No members matching "${search}"` : 'No team members yet.'}
//                   </p>
//                   {!search && (
//                     <button
//                       onClick={handleAdd}
//                       className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors"
//                     >
//                       <Plus size={14} />
//                       Add First Member
//                     </button>
//                   )}
//                 </td>
//               </tr>
//             ) : (
//               filtered.map((row, idx) => (
//                 <tr key={row.id} className={`group transition-colors hover:bg-blue-50/30 ${idx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}>
//                   <td className="px-2 py-1">
//                     <div className="flex items-center gap-2">
//                       <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
//                         {String(row.name || '?')[0].toUpperCase()}
//                       </div>
//                       <InlineInput value={row.name} onCommit={val => handleUpdate(row.id, 'name', val)} placeholder="Full name" />
//                     </div>
//                   </td>
//                   <td className="px-2 py-1">
//                     <select
//                       value={String(row.role ?? 'Member')}
//                       onChange={e => handleUpdate(row.id, 'role', e.target.value)}
//                       className={`px-2.5 py-1 text-xs font-semibold rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 transition-all ${ROLE_STYLES[row.role] || ROLE_STYLES.Member}`}
//                     >
//                       {ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
//                     </select>
//                   </td>
//                   <td className="px-2 py-1">
//                     <InlineInput value={row.email} onCommit={val => handleUpdate(row.id, 'email', val)} placeholder="email@example.com" />
//                   </td>
//                   <td className="px-2 py-1">
//                     <select
//                       value={String(row.status ?? 'Active')}
//                       onChange={e => handleUpdate(row.id, 'status', e.target.value)}
//                       className={`px-2.5 py-1 text-xs font-semibold rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 transition-all ${STATUS_STYLES[row.status] || STATUS_STYLES.Active}`}
//                     >
//                       {['Active', 'On Leave', 'Inactive'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
//                     </select>
//                   </td>
//                   <td className="px-2 py-1">
//                     <DeptCell
//                       memberId={row.id}
//                       memberName={row.name}
//                       value={row.departments || ''}
//                       deptOptions={deptOptions}
//                       onUpdate={handleUpdate}
//                     />
//                   </td>
//                   <td className="px-2 py-1 text-center">
//                     <button
//                       onClick={() => handleDelete(row.id)}
//                       className="p-1.5 rounded-lg text-gray-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
//                     >
//                       <Trash2 size={14} />
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       <button
//         onClick={handleAdd}
//         className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm"
//       >
//         <Plus size={14} />
//         Add Team Member
//       </button>
//     </div>
//   );
// }














'use client';

import { useState, useCallback, useEffect } from 'react';
import { Check, X, Plus, Trash2, UserCircle, Building2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useRealtimeTable } from '@/lib/realtime';
import { DEPARTMENT_ICONS } from '@/lib/departments';
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

interface DeptOption {
  id: string;
  name: string;
  icon: string;
}

async function syncMemberToDepartments(name: string, role: string, departments: string) {
  await fetch('/api/department-team-members/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, role, departments }),
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
        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all text-left min-h-[36px]"
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
      className="w-full px-2.5 py-1.5 text-sm bg-transparent border border-transparent rounded-lg hover:border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-50 outline-none transition-all placeholder-gray-300"
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

  const activeCount = data.filter(m => m.status === 'Active').length;
  const leadCount = data.filter(m => m.role === 'Lead').length;

  const handleAdd = useCallback(async () => {
    const res = await fetch('/api/team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', role: 'Member', email: '', departments: '', profit_pct: 0, status: 'Active' }),
    });
    if (res.ok) {
      const inserted = await res.json();
      setData(prev => [...prev, inserted]);
    } else {
      await refetch();
    }
  }, [setData, refetch]);

  const handleUpdate = useCallback(async (id: string, key: string, value: string | number) => {
    // Capture BEFORE optimistic update — prevents stale closure reading old data
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
      await syncMemberToDepartments(member.name, member.role || '', String(value));
      window.dispatchEvent(new CustomEvent('department-team-members-updated'));
    }

    if (key === 'role') {
      if (!member?.name || !member?.departments) return;
      await fetch('/api/department-team-members/update-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: member.name,
          departments: member.departments,
          in_charge: value === 'Lead',
        }),
      });
      // Notify department Team tabs to refetch — this was missing before
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
          if (row?.id) {
            await fetch(`/api/department-team-members/${row.id}`, { method: 'DELETE' });
          }
        })
      );

      window.dispatchEvent(new CustomEvent('department-team-members-updated'));
    }
  }, [data, setData]);

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
      <div className="flex items-center justify-between gap-3 flex-wrap">
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

        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members…"
            className="pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all w-52"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '180px' }}>Name</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '120px' }}>Role</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '200px' }}>Email</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '120px' }}>Status</th>
              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3" style={{ minWidth: '200px' }}>Departments</th>
              <th className="w-12 bg-gray-50" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <UserCircle size={32} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400 mb-1">
                    {search ? `No members matching "${search}"` : 'No team members yet.'}
                  </p>
                  {!search && (
                    <button
                      onClick={handleAdd}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors"
                    >
                      <Plus size={14} />
                      Add First Member
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr key={row.id} className={`group transition-colors hover:bg-blue-50/30 ${idx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}>
                  <td className="px-2 py-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {String(row.name || '?')[0].toUpperCase()}
                      </div>
                      <InlineInput value={row.name} onCommit={val => handleUpdate(row.id, 'name', val)} placeholder="Full name" />
                    </div>
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={String(row.role ?? 'Member')}
                      onChange={e => handleUpdate(row.id, 'role', e.target.value)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 transition-all ${ROLE_STYLES[row.role] || ROLE_STYLES.Member}`}
                    >
                      {ROLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <InlineInput value={row.email} onCommit={val => handleUpdate(row.id, 'email', val)} placeholder="email@example.com" />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      value={String(row.status ?? 'Active')}
                      onChange={e => handleUpdate(row.id, 'status', e.target.value)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border cursor-pointer outline-none focus:ring-2 focus:ring-blue-100 transition-all ${STATUS_STYLES[row.status] || STATUS_STYLES.Active}`}
                    >
                      {['Active', 'On Leave', 'Inactive'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <DeptCell
                      memberId={row.id}
                      memberName={row.name}
                      value={row.departments || ''}
                      deptOptions={deptOptions}
                      onUpdate={handleUpdate}
                    />
                  </td>
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