// 'use client';

// import { useState, useCallback } from 'react';
// import { Plus, Trash2, ChevronDown, ChevronUp, Crown, Star, ThumbsUp, ThumbsDown, Clock, Calendar, DollarSign, Briefcase, StickyNote, User } from 'lucide-react';
// import { supabase } from '@/lib/supabase';
// import { useRealtimeTable } from '@/lib/realtime';
// import { useAuth } from '@/lib/auth-context';
// import { DEPARTMENTS } from '@/lib/departments';
// import type { DepartmentTeamMember } from '@/lib/types';
// import { CURRENCIES } from '@/lib/types';

// interface DepartmentTeamSectionProps {
//   departmentId: string;
// }

// const ALL_PROJECTS = DEPARTMENTS.filter(d => d.id !== 'dashboard' && d.id !== 'admin').map(d => ({ id: d.id, name: d.name }));

// function FieldLabel({ children }: { children: React.ReactNode }) {
//   return <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{children}</span>;
// }

// interface MemberCardProps {
//   member: DepartmentTeamMember;
//   onUpdate: (id: string, key: string, value: string | number | boolean) => void;
//   onDelete: (id: string) => void;
// }

// function MemberCard({ member, onUpdate, onDelete }: MemberCardProps) {
//   const [expanded, setExpanded] = useState(false);
//   const [confirmDelete, setConfirmDelete] = useState(false);

//   const selectedProjects = member.assigned_projects
//     ? member.assigned_projects.split(',').map(s => s.trim()).filter(Boolean)
//     : [];

//   function toggleProject(projectId: string) {
//     const updated = selectedProjects.includes(projectId)
//       ? selectedProjects.filter(p => p !== projectId)
//       : [...selectedProjects, projectId];
//     onUpdate(member.id, 'assigned_projects', updated.join(','));
//   }

//   return (
//     <div className={`bg-white rounded-xl border transition-all duration-200 ${member.in_charge ? 'border-amber-300 shadow-amber-50 shadow-md' : 'border-gray-200 shadow-sm'}`}>
//       <div className="p-4">
//         <div className="flex items-start gap-3">
//           <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${member.in_charge ? 'bg-amber-100' : 'bg-blue-50'}`}>
//             {member.in_charge ? <Crown size={18} className="text-amber-500" /> : <User size={18} className="text-blue-400" />}
//           </div>

//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-2 mb-1">
//               <input
//                 type="text"
//                 value={member.name}
//                 onChange={e => onUpdate(member.id, 'name', e.target.value)}
//                 placeholder="Name"
//                 className="text-base font-semibold text-gray-900 bg-transparent border-0 outline-none focus:ring-0 p-0 w-full placeholder-gray-300"
//               />
//               {member.in_charge && (
//                 <span className="flex-shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">IN CHARGE</span>
//               )}
//             </div>

//             <div className="flex items-center gap-3 flex-wrap">
//               <label className="flex items-center gap-1.5 cursor-pointer select-none">
//                 <div
//                   onClick={() => onUpdate(member.id, 'in_charge', !member.in_charge)}
//                   className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${member.in_charge ? 'bg-amber-400' : 'bg-gray-200'}`}
//                 >
//                   <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${member.in_charge ? 'translate-x-4' : 'translate-x-0.5'}`} />
//                 </div>
//                 <span className="text-[11px] text-gray-500">Lead</span>
//               </label>

//               <div className="flex items-center gap-1">
//                 <span className="text-[11px] text-gray-400">Reports to:</span>
//                 <input
//                   type="text"
//                   value={member.reports_to}
//                   onChange={e => onUpdate(member.id, 'reports_to', e.target.value)}
//                   placeholder="—"
//                   className="text-[12px] text-gray-600 bg-transparent border-0 outline-none focus:ring-0 p-0 w-24 placeholder-gray-300"
//                 />
//               </div>
//             </div>
//           </div>

//           <div className="flex items-center gap-2 flex-shrink-0">
//             <button
//               onClick={() => setExpanded(v => !v)}
//               className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
//             >
//               {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//             </button>
//             {confirmDelete ? (
//               <div className="flex items-center gap-1">
//                 <button
//                   onClick={() => onDelete(member.id)}
//                   className="text-[11px] font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors"
//                 >
//                   Confirm
//                 </button>
//                 <button
//                   onClick={() => setConfirmDelete(false)}
//                   className="text-[11px] font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded transition-colors"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             ) : (
//               <button
//                 onClick={() => setConfirmDelete(true)}
//                 className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
//               >
//                 <Trash2 size={15} />
//               </button>
//             )}
//           </div>
//         </div>

//         <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
//           <div>
//             <FieldLabel><Clock size={10} className="inline mr-1" />Hrs/Day</FieldLabel>
//             <input
//               type="number"
//               step="0.5"
//               min="0"
//               max="24"
//               value={member.hours_per_day}
//               onChange={e => onUpdate(member.id, 'hours_per_day', parseFloat(e.target.value) || 0)}
//               className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
//             />
//           </div>
//           <div>
//             <FieldLabel><Calendar size={10} className="inline mr-1" />Days/Week</FieldLabel>
//             <input
//               type="number"
//               step="0.5"
//               min="0"
//               max="7"
//               value={member.days_per_week}
//               onChange={e => onUpdate(member.id, 'days_per_week', parseFloat(e.target.value) || 0)}
//               className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
//             />
//           </div>
//           <div>
//             <FieldLabel><DollarSign size={10} className="inline mr-1" />Salary</FieldLabel>
//             <input
//               type="number"
//               step="any"
//               min="0"
//               value={member.salary}
//               onChange={e => onUpdate(member.id, 'salary', parseFloat(e.target.value) || 0)}
//               className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
//             />
//           </div>
//           <div>
//             <FieldLabel>Currency</FieldLabel>
//             <select
//               value={member.salary_currency}
//               onChange={e => onUpdate(member.id, 'salary_currency', e.target.value)}
//               className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
//             >
//               {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
//             </select>
//           </div>
//         </div>

//         <div className="mt-3">
//           <FieldLabel><Star size={10} className="inline mr-1" />Main Skills</FieldLabel>
//           <input
//             type="text"
//             value={member.main_skills}
//             onChange={e => onUpdate(member.id, 'main_skills', e.target.value)}
//             placeholder="e.g. SEO, Copywriting, Data Analysis"
//             className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
//           />
//         </div>
//       </div>

//       {expanded && (
//         <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div>
//               <FieldLabel><ThumbsUp size={10} className="inline mr-1 text-green-500" />Tasks They Love</FieldLabel>
//               <textarea
//                 value={member.tasks_love}
//                 onChange={e => onUpdate(member.id, 'tasks_love', e.target.value)}
//                 placeholder="Describe tasks they enjoy..."
//                 rows={3}
//                 className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none"
//               />
//             </div>
//             <div>
//               <FieldLabel><ThumbsDown size={10} className="inline mr-1 text-red-400" />Tasks They Dislike</FieldLabel>
//               <textarea
//                 value={member.tasks_hate}
//                 onChange={e => onUpdate(member.id, 'tasks_hate', e.target.value)}
//                 placeholder="Describe tasks they dislike..."
//                 rows={3}
//                 className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none"
//               />
//             </div>
//           </div>

//           <div>
//             <div className="flex items-center gap-3 mb-1">
//               <FieldLabel>Bonus Structure</FieldLabel>
//               <div
//                 onClick={() => onUpdate(member.id, 'bonus_structure', !member.bonus_structure)}
//                 className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${member.bonus_structure ? 'bg-green-400' : 'bg-gray-200'}`}
//               >
//                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${member.bonus_structure ? 'translate-x-4' : 'translate-x-0.5'}`} />
//               </div>
//               {member.bonus_structure && <span className="text-[11px] text-green-600 font-medium">Eligible</span>}
//             </div>
//             {member.bonus_structure && (
//               <textarea
//                 value={member.bonus_details}
//                 onChange={e => onUpdate(member.id, 'bonus_details', e.target.value)}
//                 placeholder="Describe the bonus structure, conditions, amounts..."
//                 rows={2}
//                 className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none"
//               />
//             )}
//           </div>

//           <div>
//             <FieldLabel><Briefcase size={10} className="inline mr-1" />Assigned Projects</FieldLabel>
//             <div className="mt-1.5 flex flex-wrap gap-1.5">
//               {ALL_PROJECTS.map(project => {
//                 const active = selectedProjects.includes(project.id);
//                 return (
//                   <button
//                     key={project.id}
//                     onClick={() => toggleProject(project.id)}
//                     className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
//                       active
//                         ? 'bg-blue-500 text-white border-blue-500'
//                         : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-500'
//                     }`}
//                   >
//                     {project.name}
//                   </button>
//                 );
//               })}
//             </div>
//             {selectedProjects.length > 0 && (
//               <p className="mt-1.5 text-[11px] text-gray-400">
//                 {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} assigned
//               </p>
//             )}
//           </div>

//           <div>
//             <FieldLabel><StickyNote size={10} className="inline mr-1" />Notes</FieldLabel>
//             <textarea
//               value={member.notes}
//               onChange={e => onUpdate(member.id, 'notes', e.target.value)}
//               placeholder="Additional notes about this person..."
//               rows={2}
//               className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none"
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default function DepartmentTeamSection({ departmentId }: DepartmentTeamSectionProps) {
//   const { user } = useAuth();
//   const { data, loading } = useRealtimeTable<DepartmentTeamMember>('department_team_members', { column: 'department_id', value: departmentId });

//   const sorted = [...data].sort((a, b) => {
//     if (a.in_charge && !b.in_charge) return -1;
//     if (!a.in_charge && b.in_charge) return 1;
//     return a.sort_order - b.sort_order;
//   });

//   const handleAdd = useCallback(async () => {
//     await supabase.from('department_team_members').insert({
//       department_id: departmentId,
//       name: '',
//       in_charge: false,
//       reports_to: '',
//       hours_per_day: 8,
//       days_per_week: 5,
//       main_skills: '',
//       tasks_love: '',
//       tasks_hate: '',
//       salary: 0,
//       salary_currency: 'USD',
//       bonus_structure: false,
//       bonus_details: '',
//       assigned_projects: '',
//       notes: '',
//       sort_order: data.length,
//       created_by: user?.id ?? null,
//     });
//   }, [departmentId, data.length, user?.id]);

//   const handleUpdate = useCallback(async (id: string, key: string, value: string | number | boolean) => {
//     await supabase.from('department_team_members').update({ [key]: value }).eq('id', id);
//   }, []);

//   const handleDelete = useCallback(async (id: string) => {
//     await supabase.from('department_team_members').delete().eq('id', id);
//   }, []);

//   if (loading) {
//     return (
//       <div className="space-y-3">
//         {[...Array(2)].map((_, i) => (
//           <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h3 className="text-sm font-semibold text-gray-700">Team for this department</h3>
//           <p className="text-[12px] text-gray-400 mt-0.5">
//             {sorted.length} member{sorted.length !== 1 ? 's' : ''} — expand a card to see full details
//           </p>
//         </div>
//         <button
//           onClick={handleAdd}
//           className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors"
//         >
//           <Plus size={14} />
//           Add Member
//         </button>
//       </div>

//       {sorted.length === 0 ? (
//         <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-xl">
//           <User size={32} className="mx-auto text-gray-200 mb-3" />
//           <p className="text-gray-400 text-sm mb-4">No team members yet for this department.</p>
//           <button
//             onClick={handleAdd}
//             className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors"
//           >
//             <Plus size={14} />
//             Add First Member
//           </button>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {sorted.map(member => (
//             <MemberCard
//               key={member.id}
//               member={member}
//               onUpdate={handleUpdate}
//               onDelete={handleDelete}
//             />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }




// 'use client';

// import { useState, useCallback, useRef, memo } from 'react';
// import { Plus, Trash2, ChevronDown, ChevronUp, Crown, Star, ThumbsUp, ThumbsDown, Clock, Calendar, DollarSign, Briefcase, StickyNote, User } from 'lucide-react';
// import { supabase } from '@/lib/supabase';
// import { useRealtimeTable } from '@/lib/realtime';
// import { useAuth } from '@/lib/auth-context';
// import { DEPARTMENTS } from '@/lib/departments';
// import type { DepartmentTeamMember } from '@/lib/types';
// import { CURRENCIES } from '@/lib/types';

// interface DepartmentTeamSectionProps {
//   departmentId: string;
// }

// const ALL_PROJECTS = DEPARTMENTS.filter(d => d.id !== 'dashboard' && d.id !== 'admin').map(d => ({ id: d.id, name: d.name }));

// function FieldLabel({ children }: { children: React.ReactNode }) {
//   return <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{children}</span>;
// }

// function LocalInput({
//   value, onChange, placeholder, className, type = 'text', step, min, max,
// }: {
//   value: string | number; onChange: (val: string | number) => void; placeholder?: string;
//   className: string; type?: 'text' | 'number'; step?: string; min?: string; max?: string;
// }) {
//   const [local, setLocal] = useState(String(value ?? ''));
//   const isFocused = useRef(false);
//   const prevValue = useRef(value);
//   if (prevValue.current !== value && !isFocused.current) {
//     prevValue.current = value;
//     setLocal(String(value ?? ''));
//   }
//   return (
//     <input
//       type={type} step={step} min={min} max={max} value={local} placeholder={placeholder}
//       onChange={e => setLocal(e.target.value)}
//       onFocus={() => { isFocused.current = true; }}
//       onBlur={() => {
//         isFocused.current = false;
//         const val = type === 'number' ? (local === '' ? 0 : parseFloat(local)) : local;
//         onChange(val);
//       }}
//       className={className}
//     />
//   );
// }

// function LocalTextarea({
//   value, onChange, placeholder, rows, className,
// }: {
//   value: string; onChange: (val: string) => void; placeholder?: string; rows?: number; className: string;
// }) {
//   const [local, setLocal] = useState(value ?? '');
//   const isFocused = useRef(false);
//   const prevValue = useRef(value);
//   if (prevValue.current !== value && !isFocused.current) {
//     prevValue.current = value;
//     setLocal(value ?? '');
//   }
//   return (
//     <textarea
//       value={local} placeholder={placeholder} rows={rows}
//       onChange={e => setLocal(e.target.value)}
//       onFocus={() => { isFocused.current = true; }}
//       onBlur={() => { isFocused.current = false; onChange(local); }}
//       className={className}
//     />
//   );
// }

// interface MemberCardProps {
//   member: DepartmentTeamMember;
//   onUpdate: (id: string, key: string, value: string | number | boolean) => void;
//   onDelete: (id: string) => void;
// }

// const MemberCard = memo(function MemberCard({ member, onUpdate, onDelete }: MemberCardProps) {
//   const [expanded, setExpanded] = useState(false);
//   const [confirmDelete, setConfirmDelete] = useState(false);

//   const selectedProjects = member.assigned_projects
//     ? member.assigned_projects.split(',').map(s => s.trim()).filter(Boolean)
//     : [];

//   function toggleProject(projectId: string) {
//     const updated = selectedProjects.includes(projectId)
//       ? selectedProjects.filter(p => p !== projectId)
//       : [...selectedProjects, projectId];
//     onUpdate(member.id, 'assigned_projects', updated.join(','));
//   }

//   return (
//     <div className={`bg-white rounded-xl border transition-all duration-200 ${member.in_charge ? 'border-amber-300 shadow-amber-50 shadow-md' : 'border-gray-200 shadow-sm'}`}>
//       <div className="p-4">
//         <div className="flex items-start gap-3">
//           <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${member.in_charge ? 'bg-amber-100' : 'bg-blue-50'}`}>
//             {member.in_charge ? <Crown size={18} className="text-amber-500" /> : <User size={18} className="text-blue-400" />}
//           </div>
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-2 mb-1">
//               <LocalInput
//                 value={member.name}
//                 onChange={val => onUpdate(member.id, 'name', val)}
//                 placeholder="Name"
//                 className="text-base font-semibold text-gray-900 bg-transparent border-0 outline-none focus:ring-0 p-0 w-full placeholder-gray-300"
//               />
//               {member.in_charge && (
//                 <span className="flex-shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">IN CHARGE</span>
//               )}
//             </div>
//             <div className="flex items-center gap-3 flex-wrap">
//               <label className="flex items-center gap-1.5 cursor-pointer select-none">
//                 <div
//                   onClick={() => onUpdate(member.id, 'in_charge', !member.in_charge)}
//                   className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${member.in_charge ? 'bg-amber-400' : 'bg-gray-200'}`}
//                 >
//                   <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${member.in_charge ? 'translate-x-4' : 'translate-x-0.5'}`} />
//                 </div>
//                 <span className="text-[11px] text-gray-500">Lead</span>
//               </label>
//               <div className="flex items-center gap-1">
//                 <span className="text-[11px] text-gray-400">Reports to:</span>
//                 <LocalInput
//                   value={member.reports_to}
//                   onChange={val => onUpdate(member.id, 'reports_to', val)}
//                   placeholder="—"
//                   className="text-[12px] text-gray-600 bg-transparent border-0 outline-none focus:ring-0 p-0 w-24 placeholder-gray-300"
//                 />
//               </div>
//             </div>
//           </div>
//           <div className="flex items-center gap-2 flex-shrink-0">
//             <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
//               {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//             </button>
//             {confirmDelete ? (
//               <div className="flex items-center gap-1">
//                 <button onClick={() => onDelete(member.id)} className="text-[11px] font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors">Confirm</button>
//                 <button onClick={() => setConfirmDelete(false)} className="text-[11px] font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded transition-colors">Cancel</button>
//               </div>
//             ) : (
//               <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
//                 <Trash2 size={15} />
//               </button>
//             )}
//           </div>
//         </div>

//         <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
//           <div>
//             <FieldLabel><Clock size={10} className="inline mr-1" />Hrs/Day</FieldLabel>
//             <LocalInput type="number" step="0.5" min="0" max="24" value={member.hours_per_day} onChange={val => onUpdate(member.id, 'hours_per_day', val)} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all" />
//           </div>
//           <div>
//             <FieldLabel><Calendar size={10} className="inline mr-1" />Days/Week</FieldLabel>
//             <LocalInput type="number" step="0.5" min="0" max="7" value={member.days_per_week} onChange={val => onUpdate(member.id, 'days_per_week', val)} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all" />
//           </div>
//           <div>
//             <FieldLabel><DollarSign size={10} className="inline mr-1" />Salary</FieldLabel>
//             <LocalInput type="number" step="any" min="0" value={member.salary} onChange={val => onUpdate(member.id, 'salary', val)} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all" />
//           </div>
//           <div>
//             <FieldLabel>Currency</FieldLabel>
//             <select value={member.salary_currency} onChange={e => onUpdate(member.id, 'salary_currency', e.target.value)} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all">
//               {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
//             </select>
//           </div>
//         </div>

//         <div className="mt-3">
//           <FieldLabel><Star size={10} className="inline mr-1" />Main Skills</FieldLabel>
//           <LocalInput value={member.main_skills} onChange={val => onUpdate(member.id, 'main_skills', val)} placeholder="e.g. SEO, Copywriting, Data Analysis" className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all" />
//         </div>
//       </div>

//       {expanded && (
//         <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div>
//               <FieldLabel><ThumbsUp size={10} className="inline mr-1 text-green-500" />Tasks They Love</FieldLabel>
//               <LocalTextarea value={member.tasks_love} onChange={val => onUpdate(member.id, 'tasks_love', val)} placeholder="Describe tasks they enjoy..." rows={3} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none" />
//             </div>
//             <div>
//               <FieldLabel><ThumbsDown size={10} className="inline mr-1 text-red-400" />Tasks They Dislike</FieldLabel>
//               <LocalTextarea value={member.tasks_hate} onChange={val => onUpdate(member.id, 'tasks_hate', val)} placeholder="Describe tasks they dislike..." rows={3} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none" />
//             </div>
//           </div>

//           <div>
//             <div className="flex items-center gap-3 mb-1">
//               <FieldLabel>Bonus Structure</FieldLabel>
//               <div onClick={() => onUpdate(member.id, 'bonus_structure', !member.bonus_structure)} className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${member.bonus_structure ? 'bg-green-400' : 'bg-gray-200'}`}>
//                 <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${member.bonus_structure ? 'translate-x-4' : 'translate-x-0.5'}`} />
//               </div>
//               {member.bonus_structure && <span className="text-[11px] text-green-600 font-medium">Eligible</span>}
//             </div>
//             {member.bonus_structure && (
//               <LocalTextarea value={member.bonus_details} onChange={val => onUpdate(member.id, 'bonus_details', val)} placeholder="Describe the bonus structure, conditions, amounts..." rows={2} className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none" />
//             )}
//           </div>

//           <div>
//             <FieldLabel><Briefcase size={10} className="inline mr-1" />Assigned Projects</FieldLabel>
//             <div className="mt-1.5 flex flex-wrap gap-1.5">
//               {ALL_PROJECTS.map(project => {
//                 const active = selectedProjects.includes(project.id);
//                 return (
//                   <button key={project.id} onClick={() => toggleProject(project.id)} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${active ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-500'}`}>
//                     {project.name}
//                   </button>
//                 );
//               })}
//             </div>
//             {selectedProjects.length > 0 && (
//               <p className="mt-1.5 text-[11px] text-gray-400">{selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} assigned</p>
//             )}
//           </div>

//           <div>
//             <FieldLabel><StickyNote size={10} className="inline mr-1" />Notes</FieldLabel>
//             <LocalTextarea value={member.notes} onChange={val => onUpdate(member.id, 'notes', val)} placeholder="Additional notes about this person..." rows={2} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none" />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

// export default function DepartmentTeamSection({ departmentId }: DepartmentTeamSectionProps) {
//   const { user } = useAuth();
//   const { data, loading, setData, refetch } = useRealtimeTable<DepartmentTeamMember>('department_team_members', { column: 'department_id', value: departmentId });

//   const sorted = [...data].sort((a, b) => {
//     if (a.in_charge && !b.in_charge) return -1;
//     if (!a.in_charge && b.in_charge) return 1;
//     return a.sort_order - b.sort_order;
//   });

//   const handleAdd = useCallback(async () => {
//     const { data: inserted } = await supabase
//       .from('department_team_members')
//       .insert({
//         department_id: departmentId,
//         name: '',
//         in_charge: false,
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
//         sort_order: data.length,
//         created_by: user?.id ?? null,
//       })
//       .select()
//       .single();

//     if (inserted) {
//       setData(prev => [...prev, inserted]);
//     } else {
//       await refetch();
//     }
//   }, [departmentId, data.length, user?.id, setData, refetch]);

// const handleUpdate = useCallback(async (id: string, key: string, value: string | number | boolean) => {
//   await supabase.from('department_team_members').update({ [key]: value }).eq('id', id);
//   setData(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
// }, [setData]);

// const handleDelete = useCallback(async (id: string) => {
//   const member = data.find(m => m.id === id);

//   await supabase.from('department_team_members').delete().eq('id', id);
//   setData(prev => prev.filter(row => row.id !== id));

//   if (member?.name) {
//     const { data: teamMember } = await supabase
//       .from('team_members')
//       .select('id, departments')
//       .eq('name', member.name)
//       .maybeSingle();

//     if (teamMember) {
//       const updatedDepts = (teamMember.departments || '')
//         .split(',')
//         .map((d: string) => d.trim())
//         .filter((d: string) => d && d !== departmentId)
//         .join(',');

//       await supabase
//         .from('team_members')
//         .update({ departments: updatedDepts })
//         .eq('id', teamMember.id);

//       // ← signal TeamView to refetch
//       window.dispatchEvent(new CustomEvent('team-members-updated'));
//     }
//   }
// }, [data, setData, departmentId]);


//   if (loading) {
//     return (
//       <div className="space-y-3">
//         {[...Array(2)].map((_, i) => (
//           <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-4">
//         <div>
//           <h3 className="text-sm font-semibold text-gray-700">Team for this department</h3>
//           <p className="text-[12px] text-gray-400 mt-0.5">
//             {sorted.length} member{sorted.length !== 1 ? 's' : ''} — expand a card to see full details
//           </p>
//         </div>
//         <button onClick={handleAdd} className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors">
//           <Plus size={14} />
//           Add Member
//         </button>
//       </div>

//       {sorted.length === 0 ? (
//         <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-xl">
//           <User size={32} className="mx-auto text-gray-200 mb-3" />
//           <p className="text-gray-400 text-sm mb-4">No team members yet for this department.</p>
//           <button onClick={handleAdd} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors">
//             <Plus size={14} />
//             Add First Member
//           </button>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {sorted.map(member => (
//             <MemberCard key={member.id} member={member} onUpdate={handleUpdate} onDelete={handleDelete} />
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
















'use client';

import { useState, useCallback, useRef, memo, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Crown, Star, ThumbsUp, ThumbsDown, Clock, Calendar, DollarSign, Briefcase, StickyNote, User } from 'lucide-react';
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{children}</span>;
}

// ── Searchable Name Dropdown ──────────────────────────────────────────────────
function NameDropdown({
  value,
  options,
  onChange,
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
        <span className={`text-base font-semibold truncate flex-1 ${isMismatch ? 'text-amber-600' : 'text-gray-900'}`}>
          {value
            ? <>{value}{isMismatch && <span className="ml-1 text-xs">⚠️</span>}</>
            : <span className="text-gray-300 font-normal">Select member…</span>
          }
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-300 group-hover:text-gray-500 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-56 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className="w-full px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 text-left italic transition-colors"
            >
              — None —
            </button>

            {isMismatch && (
              <button
                onClick={() => { onChange(value); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <span className="flex-1 text-left truncate">{value}</span>
                <span className="text-[10px] shrink-0 opacity-70">⚠️ not in list</span>
              </button>
            )}

            {options.length === 0 ? (
              <p className="px-3 py-3 text-xs text-gray-400 text-center">No members yet</p>
            ) : (
              options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { onChange(opt.name); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-blue-50 ${
                    opt.name === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
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
  allProjects: Project[];
  teamOptions: TeamMemberOption[];
  onUpdate: (id: string, key: string, value: string | number | boolean) => void;
  onDelete: (id: string) => void;
}

const MemberCard = memo(function MemberCard({ member, allProjects, teamOptions, onUpdate, onDelete }: MemberCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    <div className={`bg-white rounded-xl border transition-all duration-200 ${member.in_charge ? 'border-amber-300 shadow-amber-50 shadow-md' : 'border-gray-200 shadow-sm'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${member.in_charge ? 'bg-amber-100' : 'bg-blue-50'}`}>
            {member.in_charge ? <Crown size={18} className="text-amber-500" /> : <User size={18} className="text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <NameDropdown
                value={member.name}
                options={teamOptions}
                onChange={val => onUpdate(member.id, 'name', val)}
              />
              {member.in_charge && (
                <span className="flex-shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">IN CHARGE</span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <div
                  onClick={() => onUpdate(member.id, 'in_charge', !member.in_charge)}
                  className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${member.in_charge ? 'bg-amber-400' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${member.in_charge ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-[11px] text-gray-500">Lead</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-gray-400">Reports to:</span>
                <LocalInput
                  value={member.reports_to}
                  onChange={val => onUpdate(member.id, 'reports_to', val)}
                  placeholder="—"
                  className="text-[12px] text-gray-600 bg-transparent border-0 outline-none focus:ring-0 p-0 w-24 placeholder-gray-300"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button onClick={() => onDelete(member.id)} className="text-[11px] font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors">Confirm</button>
                <button onClick={() => setConfirmDelete(false)} className="text-[11px] font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded transition-colors">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <FieldLabel><Clock size={10} className="inline mr-1" />Hrs/Day</FieldLabel>
            <LocalInput type="number" step="0.5" min="0" max="24" value={member.hours_per_day} onChange={val => onUpdate(member.id, 'hours_per_day', val)} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all" />
          </div>
          <div>
            <FieldLabel><Calendar size={10} className="inline mr-1" />Days/Week</FieldLabel>
            <LocalInput type="number" step="0.5" min="0" max="7" value={member.days_per_week} onChange={val => onUpdate(member.id, 'days_per_week', val)} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all" />
          </div>
          <div>
            <FieldLabel><DollarSign size={10} className="inline mr-1" />Salary</FieldLabel>
            <LocalInput type="number" step="any" min="0" value={member.salary} onChange={val => onUpdate(member.id, 'salary', val)} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all" />
          </div>
          <div>
            <FieldLabel>Currency</FieldLabel>
            <select value={member.salary_currency} onChange={e => onUpdate(member.id, 'salary_currency', e.target.value)} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <FieldLabel><Star size={10} className="inline mr-1" />Main Skills</FieldLabel>
          <LocalInput value={member.main_skills} onChange={val => onUpdate(member.id, 'main_skills', val)} placeholder="e.g. SEO, Copywriting, Data Analysis" className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all" />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel><ThumbsUp size={10} className="inline mr-1 text-green-500" />Tasks They Love</FieldLabel>
              <LocalTextarea value={member.tasks_love} onChange={val => onUpdate(member.id, 'tasks_love', val)} placeholder="Describe tasks they enjoy..." rows={3} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none" />
            </div>
            <div>
              <FieldLabel><ThumbsDown size={10} className="inline mr-1 text-red-400" />Tasks They Dislike</FieldLabel>
              <LocalTextarea value={member.tasks_hate} onChange={val => onUpdate(member.id, 'tasks_hate', val)} placeholder="Describe tasks they dislike..." rows={3} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <FieldLabel>Bonus Structure</FieldLabel>
              <div onClick={() => onUpdate(member.id, 'bonus_structure', !member.bonus_structure)} className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${member.bonus_structure ? 'bg-green-400' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${member.bonus_structure ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              {member.bonus_structure && <span className="text-[11px] text-green-600 font-medium">Eligible</span>}
            </div>
            {member.bonus_structure && (
              <LocalTextarea value={member.bonus_details} onChange={val => onUpdate(member.id, 'bonus_details', val)} placeholder="Describe the bonus structure, conditions, amounts..." rows={2} className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none" />
            )}
          </div>

          <div>
            <FieldLabel><Briefcase size={10} className="inline mr-1" />Assigned Projects</FieldLabel>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {allProjects.map(project => {
                const active = selectedProjects.includes(project.id);
                return (
                  <button key={project.id} onClick={() => toggleProject(project.id)} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${active ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-500'}`}>
                    {project.name}
                  </button>
                );
              })}
            </div>
            {selectedProjects.length > 0 && (
              <p className="mt-1.5 text-[11px] text-gray-400">{selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} assigned</p>
            )}
          </div>

          <div>
            <FieldLabel><StickyNote size={10} className="inline mr-1" />Notes</FieldLabel>
            <LocalTextarea value={member.notes} onChange={val => onUpdate(member.id, 'notes', val)} placeholder="Additional notes about this person..." rows={2} className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none" />
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

  // Fetch all departments for projects picker
  useEffect(() => {
    fetch('/api/departments')
      .then(res => res.ok ? res.json() : [])
      .then((depts: { id: string; name: string }[]) => {
        setAllProjects(
          depts
            .filter(d => d.id !== 'dashboard' && d.id !== 'admin')
            .map(d => ({ id: d.id, name: d.name }))
        );
      })
      .catch(() => setAllProjects([]));
  }, []);

  // Fetch team members for name dropdown — refresh on team-members-updated
  useEffect(() => {
    const load = () => {
      fetch('/api/team-members')
        .then(res => res.ok ? res.json() : [])
        .then((members: TeamMemberOption[]) => {
          setTeamOptions(
            members
              .filter(m => m.name)
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        })
        .catch(() => setTeamOptions([]));
    };
    load();
    window.addEventListener('team-members-updated', load);
    return () => window.removeEventListener('team-members-updated', load);
  }, []);

  // Listen for sync events from TeamView
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
    const res = await fetch('/api/department-team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        department_id: departmentId,
        name: '',
        in_charge: false,
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
        sort_order: data.length,
        created_by: profile?.id ?? null,
      }),
    });

    if (res.ok) {
      const inserted = await res.json();
      setData(prev => [...prev, inserted]);
    } else {
      await refetch();
    }
  }, [departmentId, data.length, profile?.id, setData, refetch]);

  const handleUpdate = useCallback(async (id: string, key: string, value: string | number | boolean) => {
    await fetch(`/api/department-team-members/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    });
    setData(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
  }, [setData]);

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
            .split(',')
            .map((d: string) => d.trim())
            .filter((d: string) => d && d !== departmentId)
            .join(',');

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
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Team for this department</h3>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {sorted.length} member{sorted.length !== 1 ? 's' : ''} — expand a card to see full details
          </p>
        </div>
        <button onClick={handleAdd} className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors">
          <Plus size={14} />
          Add Member
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-xl">
          <User size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm mb-4">No team members yet for this department.</p>
          <button onClick={handleAdd} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors">
            <Plus size={14} />
            Add First Member
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(member => (
            <MemberCard
              key={member.id}
              member={member}
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