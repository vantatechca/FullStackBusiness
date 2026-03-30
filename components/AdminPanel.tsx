
// 'use client';

// import { useState, useEffect } from 'react';
// import { useAuth } from '@/lib/auth-context';
// import { useRealtimeTable } from '@/lib/realtime';
// import { useCurrency } from '@/lib/currency-context';
// import { DEPARTMENT_ICONS } from '@/lib/departments';
// import type { Profile, TeamMember } from '@/lib/types';
// import { Users, Shield, RefreshCw, Settings, CircleCheck as CheckCircle, Circle as XCircle, Globe, Activity, Database, CreditCard as Edit2, X } from 'lucide-react';

// type AdminTab = 'users' | 'exchange-rates' | 'system';

// interface DeptOption {
//   id: string;
//   name: string;
//   icon: string;
//   type: string;
// }

// function useDepartments() {
//   const [departments, setDepartments] = useState<DeptOption[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetch('/api/departments')
//       .then(r => r.ok ? r.json() : [])
//       .then((data: DeptOption[]) => setDepartments(data))
//       .catch(() => setDepartments([]))
//       .finally(() => setLoading(false));
//   }, []);

//   return { departments, loading };
// }

// function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
//         active ? 'bg-[#3b82f6] text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
//       }`}
//     >
//       {children}
//     </button>
//   );
// }

// function RoleBadge({ role }: { role: string }) {
//   const colors: Record<string, string> = {
//     admin: 'bg-red-100 text-red-700 border border-red-200',
//     manager: 'bg-amber-100 text-amber-700 border border-amber-200',
//     member: 'bg-gray-100 text-gray-600 border border-gray-200',
//   };
//   return (
//     <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || colors.member}`}>
//       {role}
//     </span>
//   );
// }

// function StatusDot({ active }: { active: boolean }) {
//   return <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-[#22c55e]' : 'bg-gray-300'}`} />;
// }

// function UsersTab({ departments }: { departments: DeptOption[] }) {
//   const { data: profiles, loading, setData } = useRealtimeTable<Profile>('profiles');
//   const { data: teamMembers } = useRealtimeTable<TeamMember>('team_members');

//   // Track which row is open for editing and what role is selected
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editingRole, setEditingRole] = useState<string>('member');
//   const [savingId, setSavingId] = useState<string | null>(null);

//   const getTeamMember = (email: string) => teamMembers.find(t => t.email === email);
//   const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || id;

//   const startEdit = (profileId: string, currentRole: string) => {
//     setEditingId(profileId);
//     setEditingRole(currentRole);
//   };

//   const cancelEdit = () => setEditingId(null);

//   const saveRole = async (profileId: string) => {
//     setSavingId(profileId);
//     await fetch(`/api/profiles/${profileId}`, {
//       method: 'PATCH',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ role: editingRole }),
//     });
//     // Optimistic update — badge reflects new role immediately
//     setData(prev => prev.map(p =>
//       p.id === profileId ? { ...p, role: editingRole as Profile['role'] } : p
//     ));
//     setSavingId(null);
//     setEditingId(null);
//   };

//   if (loading) {
//     return (
//       <div className="space-y-3">
//         {[...Array(4)].map((_, i) => (
//           <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <div>
//           <h3 className="font-semibold text-gray-900">Registered Users</h3>
//           <p className="text-sm text-gray-500 mt-0.5">{profiles.length} user{profiles.length !== 1 ? 's' : ''} in the system</p>
//         </div>
//       </div>

//       <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
//         <div className="grid grid-cols-[2fr_1fr_2fr_1fr] gap-0 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
//           <span>User</span>
//           <span>Role</span>
//           <span>Departments</span>
//           <span>Status</span>
//         </div>
//         <div className="divide-y divide-gray-100">
//           {profiles.length === 0 && (
//             <div className="px-5 py-8 text-center text-sm text-gray-400">No users found</div>
//           )}
//           {profiles.map(p => {
//             const tm = getTeamMember(p.email);
//             const depts = tm?.departments
//               ? tm.departments.split(',').map(d => d.trim()).filter(Boolean)
//               : [];
//             const isEditing = editingId === p.id;

//             return (
//               <div key={p.id} className="grid grid-cols-[2fr_1fr_2fr_1fr] gap-0 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors">
//                 <div className="flex items-center gap-3 min-w-0">
//                   <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] text-sm font-bold shrink-0">
//                     {(p.full_name || p.email || '?')[0].toUpperCase()}
//                   </div>
//                   <div className="min-w-0">
//                     <div className="text-sm font-medium text-gray-900 truncate">{p.full_name || '—'}</div>
//                     <div className="text-xs text-gray-500 truncate">{p.email}</div>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-1.5">
//                   {isEditing ? (
//                     <div className="flex items-center gap-1">
//                       {/* Controlled select — value synced to editingRole state */}
//                       <select
//                         value={editingRole}
//                         onChange={e => setEditingRole(e.target.value)}
//                         disabled={savingId === p.id}
//                         className="text-xs border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none"
//                       >
//                         <option value="admin">admin</option>
//                         <option value="manager">manager</option>
//                         <option value="member">member</option>
//                       </select>
//                       <button
//                         onClick={() => saveRole(p.id)}
//                         disabled={savingId === p.id}
//                         className="text-[11px] font-medium text-white bg-[#3b82f6] hover:bg-[#2563eb] px-2 py-1 rounded transition-colors disabled:opacity-50"
//                       >
//                         {savingId === p.id ? '…' : 'Save'}
//                       </button>
//                       <button onClick={cancelEdit} className="p-0.5 text-gray-400 hover:text-gray-600">
//                         <X size={14} />
//                       </button>
//                     </div>
//                   ) : (
//                     <div className="flex items-center gap-1.5 group">
//                       <RoleBadge role={p.role} />
//                       <button
//                         onClick={() => startEdit(p.id, p.role)}
//                         className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-opacity"
//                       >
//                         <Edit2 size={12} />
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex flex-wrap gap-1 pr-4">
//                   {depts.length === 0 ? (
//                     <span className="text-xs text-gray-400 italic">All (admin)</span>
//                   ) : (
//                     depts.slice(0, 3).map(d => (
//                       <span key={d} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100">
//                         {getDeptName(d)}
//                       </span>
//                     ))
//                   )}
//                   {depts.length > 3 && (
//                     <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
//                       +{depts.length - 3}
//                     </span>
//                   )}
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <StatusDot active={true} />
//                   <span className="text-xs text-gray-500">Active</span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
//         <div className="flex items-start gap-3">
//           <Shield size={16} className="text-amber-600 mt-0.5 shrink-0" />
//           <div>
//             <p className="text-sm font-medium text-amber-800">Role Permissions</p>
//             <ul className="mt-1.5 space-y-1">
//               <li className="text-xs text-amber-700"><span className="font-semibold">Admin</span> — Full access to all departments, team, and admin panel</li>
//               <li className="text-xs text-amber-700"><span className="font-semibold">Manager</span> — Access to all departments, no admin panel</li>
//               <li className="text-xs text-amber-700"><span className="font-semibold">Member</span> — Access only to departments assigned in Team Members</li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function ExchangeRatesTab() {
//   const { rates, refreshRates, ratesLoading } = useCurrency();
//   const [lastUpdated, setLastUpdated] = useState<string | null>(null);

//   useEffect(() => {
//     fetch('/api/exchange-rates')
//       .then(r => r.json())
//       .then(data => {
//         if (data?.last_updated) setLastUpdated(data.last_updated);
//       })
//       .catch(console.error);
//   }, [rates]);

//   const rateEntries = rates ? Object.entries(rates).sort((a, b) => a[0].localeCompare(b[0])) : [];

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between">
//         <div>
//           <h3 className="font-semibold text-gray-900">Exchange Rates</h3>
//           <p className="text-sm text-gray-500 mt-0.5">
//             Base: USD — {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleString()}` : 'Not yet updated'}
//           </p>
//         </div>
//         <button
//           onClick={refreshRates}
//           disabled={ratesLoading}
//           className="flex items-center gap-2 px-3 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors disabled:opacity-50"
//         >
//           <RefreshCw size={14} className={ratesLoading ? 'animate-spin' : ''} />
//           Refresh Rates
//         </button>
//       </div>

//       <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
//         <div className="grid grid-cols-3 gap-0 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
//           <span>Currency</span>
//           <span>Rate (vs USD)</span>
//           <span>1 USD =</span>
//         </div>
//         <div className="divide-y divide-gray-100">
//           {rateEntries.length === 0 && (
//             <div className="px-5 py-8 text-center text-sm text-gray-400">
//               No rates loaded. Click &quot;Refresh Rates&quot; to fetch latest.
//             </div>
//           )}
//           {rateEntries.map(([currency, rate]) => (
//             <div key={currency} className="grid grid-cols-3 gap-0 px-5 py-3 items-center hover:bg-gray-50">
//               <span className="text-sm font-semibold text-gray-900">{currency}</span>
//               <span className="text-sm text-gray-600 font-mono">{Number(rate).toFixed(6)}</span>
//               <span className="text-sm text-gray-500">{Number(rate).toFixed(4)} {currency}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// function SystemTab({ departments, deptsLoading }: { departments: DeptOption[]; deptsLoading: boolean }) {
//   const { data: profiles } = useRealtimeTable<Profile>('profiles');
//   const { data: teamMembers } = useRealtimeTable<TeamMember>('team_members');
//   const [dbStats, setDbStats] = useState<Record<string, number>>({});
//   const [statsLoading, setStatsLoading] = useState(true);

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         const tables = ['revenue', 'expenses', 'tasks', 'gmb_listings', 'influencers', 'suppliers', 'department_notes'];
//         const results = await Promise.all(
//           tables.map(t => fetch(`/api/table-data?table=${t}`).then(r => r.json()))
//         );
//         const stats: Record<string, number> = {};
//         tables.forEach((t, i) => { stats[t] = Array.isArray(results[i]) ? results[i].length : 0; });
//         setDbStats(stats);
//       } catch (err) {
//         console.error('Failed to fetch stats:', err);
//       } finally {
//         setStatsLoading(false);
//       }
//     };
//     fetchStats();
//   }, []);

//   const visibleDepts = departments.filter(d => d.id !== 'dashboard' && d.id !== 'admin');

//   const statCards = [
//     { label: 'Registered Users', value: profiles.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
//     { label: 'Team Members', value: teamMembers.length, icon: Shield, color: 'bg-green-50 text-green-600' },
//     { label: 'Revenue Records', value: dbStats.revenue ?? '—', icon: Activity, color: 'bg-emerald-50 text-emerald-600' },
//     { label: 'Expense Records', value: dbStats.expenses ?? '—', icon: Database, color: 'bg-red-50 text-red-600' },
//     { label: 'Tasks', value: dbStats.tasks ?? '—', icon: CheckCircle, color: 'bg-amber-50 text-amber-600' },
//     { label: 'GMB Listings', value: dbStats.gmb_listings ?? '—', icon: Globe, color: 'bg-sky-50 text-sky-600' },
//     { label: 'Influencers', value: dbStats.influencers ?? '—', icon: Users, color: 'bg-pink-50 text-pink-600' },
//     { label: 'Suppliers', value: dbStats.suppliers ?? '—', icon: Database, color: 'bg-orange-50 text-orange-600' },
//   ];

//   return (
//     <div className="space-y-6">
//       <div>
//         <h3 className="font-semibold text-gray-900">System Overview</h3>
//         <p className="text-sm text-gray-500 mt-0.5">Database statistics and system health</p>
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//         {statCards.map(card => {
//           const Icon = card.icon;
//           return (
//             <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
//               <div className="flex items-center gap-3 mb-2">
//                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
//                   <Icon size={16} />
//                 </div>
//               </div>
//               <div className="text-2xl font-bold text-gray-900">
//                 {statsLoading ? <span className="text-gray-300">—</span> : card.value}
//               </div>
//               <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
//             </div>
//           );
//         })}
//       </div>

//       <div className="bg-white border border-gray-200 rounded-xl p-5">
//         <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
//           <Activity size={14} className="text-[#3b82f6]" />
//           System Status
//         </h4>
//         <div className="space-y-3">
//           {[
//             { label: 'Database Connection', ok: true },
//             { label: 'Authentication', ok: true },
//             { label: 'Exchange Rate Service', ok: true },
//             { label: 'API Routes', ok: true },
//           ].map(item => (
//             <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
//               <span className="text-sm text-gray-700">{item.label}</span>
//               <div className="flex items-center gap-1.5">
//                 {item.ok ? (
//                   <>
//                     <CheckCircle size={14} className="text-[#22c55e]" />
//                     <span className="text-xs text-[#22c55e] font-medium">Operational</span>
//                   </>
//                 ) : (
//                   <>
//                     <XCircle size={14} className="text-[#ef4444]" />
//                     <span className="text-xs text-[#ef4444] font-medium">Error</span>
//                   </>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div className="bg-white border border-gray-200 rounded-xl p-5">
//         <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
//           <Settings size={14} className="text-gray-500" />
//           Department Registry
//           <span className="ml-auto text-xs text-gray-400 font-normal">{visibleDepts.length} departments</span>
//         </h4>
//         {deptsLoading ? (
//           <div className="space-y-2">
//             {[...Array(4)].map((_, i) => <div key={i} className="h-7 bg-gray-100 rounded animate-pulse" />)}
//           </div>
//         ) : (
//           <div className="space-y-1.5">
//             {visibleDepts.map(d => {
//               const Icon = DEPARTMENT_ICONS[d.icon];
//               return (
//                 <div key={d.id} className="flex items-center justify-between py-1.5 text-sm">
//                   <div className="flex items-center gap-2">
//                     {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
//                     <span className="text-gray-700">{d.name}</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 font-mono">{d.type}</span>
//                     <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{d.id}</span>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default function AdminPanel() {
//   const [activeTab, setActiveTab] = useState<AdminTab>('users');
//   const { profile } = useAuth();
//   const { departments, loading: deptsLoading } = useDepartments();

//   if (profile?.role !== 'admin') {
//     return (
//       <div className="flex flex-col items-center justify-center py-24 text-center">
//         <Shield size={40} className="text-gray-300 mb-4" />
//         <p className="text-gray-500 font-medium">Access Denied</p>
//         <p className="text-sm text-gray-400 mt-1">Admin access required to view this panel.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center gap-3">
//         <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
//           <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
//             <span className="flex items-center gap-1.5"><Users size={14} />Users & Roles</span>
//           </TabButton>
//           <TabButton active={activeTab === 'exchange-rates'} onClick={() => setActiveTab('exchange-rates')}>
//             <span className="flex items-center gap-1.5"><Globe size={14} />Exchange Rates</span>
//           </TabButton>
//           <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')}>
//             <span className="flex items-center gap-1.5"><Settings size={14} />System</span>
//           </TabButton>
//         </div>
//       </div>

//       {activeTab === 'users' && <UsersTab departments={departments} />}
//       {activeTab === 'exchange-rates' && <ExchangeRatesTab />}
//       {activeTab === 'system' && <SystemTab departments={departments} deptsLoading={deptsLoading} />}
//     </div>
//   );
// } 


'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRealtimeTable } from '@/lib/realtime';
import { useCurrency } from '@/lib/currency-context';
import { DEPARTMENT_ICONS } from '@/lib/departments';
import { logAudit } from '@/lib/audit';
import type { Profile, TeamMember } from '@/lib/types';
import {
  Users, Shield, RefreshCw, Settings,
  CircleCheck as CheckCircle, Circle as XCircle,
  Globe, Activity, Database, CreditCard as Edit2, X, Lock,
  Plus, Trash2, FileText, Eye, EyeOff, UserPlus, ScrollText,
} from 'lucide-react';
import { toast } from 'sonner';

type AdminTab = 'users' | 'exchange-rates' | 'system' | 'audit-logs';

interface DeptOption {
  id: string;
  name: string;
  icon: string;
  type: string;
}

function useDepartments() {
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/departments')
      .then(r => r.ok ? r.json() : [])
      .then((data: DeptOption[]) => setDepartments(data))
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false));
  }, []);

  return { departments, loading };
}

function TabButton({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
      }`}
    >
      {children}
    </button>
  );
}

const ROLE_CONFIG: Record<string, { style: string; dot: string }> = {
  super_admin: { style: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-400' },
  admin:       { style: 'bg-red-50 text-red-700 border-red-200',         dot: 'bg-red-400'    },
  manager:     { style: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400'  },
  member:      { style: 'bg-gray-100 text-gray-600 border-gray-200',     dot: 'bg-gray-400'   },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.member;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {role}
    </span>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab({ departments }: { departments: DeptOption[] }) {
  const { data: profiles, loading, setData, refetch } = useRealtimeTable<Profile>('profiles');
  const { data: teamMembers } = useRealtimeTable<TeamMember>('team_members');
  const { isSuperAdmin } = useAuth();
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>('member');
  const [savingId,    setSavingId]    = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<string>('member');
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);

  const getTeamMember = (email: string) => teamMembers.find(t => t.email === email);
  const getDeptName   = (id: string)    => departments.find(d => d.id === id)?.name || id;

  const startEdit  = (id: string, role: string) => { setEditingId(id); setEditingRole(role); };
  const cancelEdit = () => setEditingId(null);

  const saveRole = async (profileId: string) => {
    setSavingId(profileId);
    const res = await fetch(`/api/profiles/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: editingRole }),
    });
    if (res.ok) {
      setData(prev => prev.map(p =>
        p.id === profileId ? { ...p, role: editingRole as Profile['role'] } : p
      ));
      const target = profiles.find(p => p.id === profileId);
      logAudit('update', 'user', profileId, { field: 'role', new_value: editingRole, user_email: target?.email });
      toast.success('Role updated');
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || `Failed to update role (${res.status})`);
    }
    setSavingId(null);
    setEditingId(null);
  };

  const handleCreateUser = async () => {
    if (!newEmail || !newName || !newPassword) { toast.error('All fields are required'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, full_name: newName, password: newPassword, role: newRole }),
      });
      if (res.ok) {
        const created = await res.json();
        logAudit('create', 'user', created.id, { email: newEmail, role: newRole });
        toast.success('User created');
        setNewEmail(''); setNewName(''); setNewPassword(''); setNewRole('member'); setShowCreateForm(false);
        await refetch();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create user');
      }
    } catch (e: any) { toast.error(e?.message || 'Failed to create user — network error'); }
    finally { setCreating(false); }
  };

  const handleDeleteUser = async (profileId: string, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    const res = await fetch(`/api/profiles/${profileId}`, { method: 'DELETE' });
    if (res.ok) {
      setData(prev => prev.filter(p => p.id !== profileId));
      logAudit('delete', 'user', profileId, { email });
      toast.success('User deleted');
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed to delete user');
    }
  };

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
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Users',   value: profiles.length,                                                                          color: 'bg-blue-50 border-blue-100 text-blue-600'     },
          { label: 'Super Admins',  value: profiles.filter(p => p.role === 'super_admin').length,                                     color: 'bg-purple-50 border-purple-100 text-purple-600' },
          { label: 'Admins',        value: profiles.filter(p => p.role === 'admin').length,                                           color: 'bg-red-50 border-red-100 text-red-600'         },
          { label: 'Members',       value: profiles.filter(p => p.role === 'member' || p.role === 'manager').length,                  color: 'bg-gray-50 border-gray-200 text-gray-600'     },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.color}`}>
            <div>
              <p className="text-xl font-bold leading-none">{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create User Button + Form (Super Admin only) */}
      {isSuperAdmin && (
        <>
          {!showCreateForm && (
            <button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] transition-colors shadow-sm">
              <UserPlus size={14} />
              Create User
            </button>
          )}
          {showCreateForm && (
            <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-gray-900">Create New User</h3>
                <button onClick={() => setShowCreateForm(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Full Name *</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Doe" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Email *</label>
                  <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="john@example.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="w-full px-3 py-2 pr-9 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Role</label>
                  <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none bg-white">
                    <option value="member">Member</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={handleCreateUser} disabled={creating} className="px-5 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] shadow-sm disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100 grid grid-cols-[2fr_1fr_2fr_auto] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <span>User</span>
          <span>Role</span>
          <span>Departments</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-gray-50">
          {profiles.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-gray-400">No users found</div>
          )}
          {profiles.map(p => {
            const tm    = getTeamMember(p.email);
            const depts = tm?.departments
              ? tm.departments.split(',').map(d => d.trim()).filter(Boolean)
              : [];
            const isEditing = editingId === p.id;

            return (
              <div
                key={p.id}
                className="grid grid-cols-[2fr_1fr_2fr_auto] gap-0 px-5 py-3.5 items-center hover:bg-blue-50/20 transition-colors"
              >
                {/* User */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                    {(p.full_name || p.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{p.full_name || '—'}</div>
                    <div className="text-xs text-gray-400 truncate">{p.email}</div>
                  </div>
                </div>

                {/* Role */}
                <div>
                  {isEditing && isSuperAdmin ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={editingRole}
                        onChange={e => setEditingRole(e.target.value)}
                        disabled={savingId === p.id}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-300 outline-none bg-white"
                      >
                        <option value="super_admin">super_admin</option>
                        <option value="admin">admin</option>
                        <option value="manager">manager</option>
                        <option value="member">member</option>
                      </select>
                      <button
                        onClick={() => saveRole(p.id)}
                        disabled={savingId === p.id}
                        className="text-[11px] font-semibold text-white bg-[#3b82f6] hover:bg-[#2563eb] px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {savingId === p.id ? '...' : 'Save'}
                      </button>
                      <button onClick={cancelEdit} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <RoleBadge role={p.role} />
                      {isSuperAdmin && (
                        <button
                          onClick={() => startEdit(p.id, p.role)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                        >
                          <Edit2 size={11} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Departments */}
                <div className="flex flex-wrap gap-1 pr-4">
                  {depts.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">{p.role === 'admin' || p.role === 'super_admin' ? 'All (admin)' : 'None assigned'}</span>
                  ) : (
                    <>
                      {depts.slice(0, 3).map(d => (
                        <span key={d} className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {getDeptName(d)}
                        </span>
                      ))}
                      {depts.length > 3 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-[11px] font-medium bg-gray-100 text-gray-600">
                          +{depts.length - 3}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDeleteUser(p.id, p.email)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Delete user"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions info */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <Shield size={15} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1.5">Role Permissions</p>
            <div className="space-y-1">
              {[
                { role: 'Super Admin', desc: 'Everything + user management, credentials, and audit logs', dot: 'bg-purple-400' },
                { role: 'Admin',       desc: 'Full access to all departments — can see, edit, and delete everything', dot: 'bg-red-400'    },
                { role: 'Manager',     desc: 'Access to all departments, no admin panel',                             dot: 'bg-amber-400'  },
                { role: 'Member',      desc: 'Access only to assigned departments and tasks. Team leads can edit assigned metrics', dot: 'bg-gray-400'   },
              ].map(r => (
                <div key={r.role} className="flex items-start gap-2 text-xs text-amber-700">
                  <span className={`w-1.5 h-1.5 rounded-full ${r.dot} shrink-0 mt-1`} />
                  <span><span className="font-bold">{r.role}</span> — {r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Exchange Rates Tab ────────────────────────────────────────────────────────
function ExchangeRatesTab() {
  const { rates, refreshRates, ratesLoading } = useCurrency();
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/exchange-rates')
      .then(r => r.json())
      .then(data => { if (data?.last_updated) setLastUpdated(data.last_updated); })
      .catch(console.error);
  }, [rates]);

  const rateEntries = rates ? Object.entries(rates).sort((a, b) => a[0].localeCompare(b[0])) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Exchange Rates</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            Base: USD · {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleString()}` : 'Not yet updated'}
          </p>
        </div>
        <button
          onClick={refreshRates}
          disabled={ratesLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={14} className={ratesLoading ? 'animate-spin' : ''} />
          Refresh Rates
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100 grid grid-cols-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <span>Currency</span>
          <span>Rate (vs USD)</span>
          <span>1 USD =</span>
        </div>
        <div className="divide-y divide-gray-50">
          {rateEntries.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              No rates loaded. Click &quot;Refresh Rates&quot; to fetch latest.
            </div>
          )}
          {rateEntries.map(([currency, rate]) => (
            <div key={currency} className="grid grid-cols-3 gap-0 px-5 py-3 items-center hover:bg-gray-50/60 transition-colors">
              <span className="text-sm font-bold text-gray-900">{currency}</span>
              <span className="text-sm text-gray-500 font-mono tabular-nums">{Number(rate).toFixed(6)}</span>
              <span className="text-sm text-gray-400 tabular-nums">{Number(rate).toFixed(4)} {currency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── System Tab ────────────────────────────────────────────────────────────────
function SystemTab({ departments, deptsLoading }: { departments: DeptOption[]; deptsLoading: boolean }) {
  const { data: profiles }    = useRealtimeTable<Profile>('profiles');
  const { data: teamMembers } = useRealtimeTable<TeamMember>('team_members');
  const [dbStats, setDbStats]       = useState<Record<string, number>>({});
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const tables = ['revenue', 'expenses', 'tasks', 'gmb_listings', 'influencers', 'suppliers', 'department_notes'];
        const results = await Promise.all(tables.map(t => fetch(`/api/table-data?table=${t}`).then(r => r.json())));
        const stats: Record<string, number> = {};
        tables.forEach((t, i) => { stats[t] = Array.isArray(results[i]) ? results[i].length : 0; });
        setDbStats(stats);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const visibleDepts = departments.filter(d => d.id !== 'dashboard' && d.id !== 'admin');

  const statCards = [
    { label: 'Registered Users',  value: profiles.length,          icon: Users,    color: 'bg-blue-50 text-blue-600',    border: 'border-blue-100'    },
    { label: 'Team Members',      value: teamMembers.length,        icon: Shield,   color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
    { label: 'Revenue Records',   value: dbStats.revenue ?? '—',   icon: Activity, color: 'bg-green-50 text-green-600',   border: 'border-green-100'   },
    { label: 'Expense Records',   value: dbStats.expenses ?? '—',  icon: Database, color: 'bg-red-50 text-red-600',       border: 'border-red-100'     },
    { label: 'Tasks',             value: dbStats.tasks ?? '—',     icon: CheckCircle, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100'  },
    { label: 'GMB Listings',      value: dbStats.gmb_listings ?? '—', icon: Globe, color: 'bg-sky-50 text-sky-600',       border: 'border-sky-100'     },
    { label: 'Influencers',       value: dbStats.influencers ?? '—', icon: Users,  color: 'bg-pink-50 text-pink-600',      border: 'border-pink-100'    },
    { label: 'Suppliers',         value: dbStats.suppliers ?? '—', icon: Database, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100'  },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900">System Overview</h3>
        <p className="text-sm text-gray-400 mt-0.5">Database statistics and system health</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`bg-white border ${card.border} rounded-2xl p-4 flex items-start gap-3`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.color} bg-opacity-60`}>
                <Icon size={15} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-none">
                  {statsLoading ? <span className="text-gray-200">—</span> : card.value}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{card.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System status */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
            <Activity size={12} className="text-blue-500" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900">System Status</h4>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { label: 'Database Connection',   ok: true },
            { label: 'Authentication',         ok: true },
            { label: 'Exchange Rate Service',  ok: true },
            { label: 'API Routes',             ok: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                item.ok
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-red-50 text-red-600 border-red-100'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${item.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {item.ok ? 'Operational' : 'Error'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Department registry */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
            <Settings size={12} className="text-gray-500" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900">Department Registry</h4>
          <span className="ml-auto text-xs text-gray-400">{visibleDepts.length} departments</span>
        </div>
        {deptsLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visibleDepts.map((d, i) => {
              const Icon = DEPARTMENT_ICONS[d.icon];
              const tileColors = [
                'bg-blue-100 text-blue-600', 'bg-violet-100 text-violet-600',
                'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600',
                'bg-rose-100 text-rose-600', 'bg-sky-100 text-sky-600',
              ];
              const tileColor = tileColors[i % tileColors.length];
              return (
                <div key={d.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${tileColor}`}>
                      {Icon && <Icon size={12} />}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-lg border border-gray-200 font-mono">{d.type}</span>
                    <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded-lg border border-gray-200">{d.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Audit Logs Tab (Super Admin only) ────────────────────────────────────────
interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  login:        'bg-blue-50 text-blue-700 border-blue-200',
  login_failed: 'bg-red-50 text-red-700 border-red-200',
  create:       'bg-emerald-50 text-emerald-700 border-emerald-200',
  update:       'bg-amber-50 text-amber-700 border-amber-200',
  delete:       'bg-rose-50 text-rose-700 border-rose-200',
};

function AuditLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));
      if (filterAction) params.set('action', filterAction);
      if (filterEntity) params.set('entity_type', filterEntity);
      const res = await fetch(`/api/audit-logs?${params}`);
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, filterAction, filterEntity]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-gray-900">Audit Logs</h3>
        <p className="text-sm text-gray-400 mt-0.5">All user actions across the system</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(0); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none bg-white">
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="login_failed">Login Failed</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        <select value={filterEntity} onChange={e => { setFilterEntity(e.target.value); setPage(0); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none bg-white">
          <option value="">All Entities</option>
          <option value="user">User</option>
          <option value="expense">Expense</option>
          <option value="revenue">Revenue</option>
          <option value="asset">Asset / Metric</option>
          <option value="task">Task</option>
          <option value="department">Department</option>
          <option value="session">Session</option>
        </select>
        <button onClick={fetchLogs} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Logs table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100 grid grid-cols-[140px_1fr_100px_100px_2fr] text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          <span>Timestamp</span>
          <span>User</span>
          <span>Action</span>
          <span>Entity</span>
          <span>Details</span>
        </div>
        <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
          {loading && logs.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-gray-400">Loading...</div>
          )}
          {!loading && logs.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-gray-400">No audit logs found</div>
          )}
          {logs.map(log => (
            <div key={log.id} className="grid grid-cols-[140px_1fr_100px_100px_2fr] gap-0 px-5 py-2.5 items-center hover:bg-gray-50/60 transition-colors text-sm">
              <span className="text-xs text-gray-400 tabular-nums">
                {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-xs text-gray-700 font-medium truncate pr-2">{log.user_email || '—'}</span>
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border w-fit ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {log.action}
              </span>
              <span className="text-xs text-gray-500">{log.entity_type || '—'}</span>
              <span className="text-xs text-gray-400 truncate">
                {log.entity_id && <span className="text-gray-500 font-mono mr-1">{log.entity_id.slice(0, 8)}</span>}
                {log.details && Object.keys(log.details).length > 0
                  ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                  : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
          Previous
        </button>
        <span className="text-xs text-gray-400">Page {page + 1}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={logs.length < PAGE_SIZE} className="px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
          Next
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const { profile, isAdmin, isSuperAdmin } = useAuth();
  const { departments, loading: deptsLoading } = useDepartments();

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-gray-300" />
        </div>
        <p className="text-gray-700 font-semibold mb-1">Access Denied</p>
        <p className="text-sm text-gray-400">Super Admin access required to view this panel.</p>
      </div>
    );
  }

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode; superOnly?: boolean }[] = [
    { key: 'users',          label: 'Users & Roles',   icon: <Users size={14} />      },
    { key: 'exchange-rates', label: 'Exchange Rates',  icon: <Globe size={14} />      },
    { key: 'system',         label: 'System',          icon: <Settings size={14} />   },
    { key: 'audit-logs',     label: 'Audit Logs',      icon: <ScrollText size={14} />, superOnly: true },
  ];

  const visibleTabs = tabs.filter(t => !t.superOnly || isSuperAdmin);

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1 w-fit">
        {visibleTabs.map(t => (
          <TabButton key={t.key} active={activeTab === t.key} onClick={() => setActiveTab(t.key)}>
            {t.icon}
            {t.label}
          </TabButton>
        ))}
      </div>

      {activeTab === 'users'          && <UsersTab departments={departments} />}
      {activeTab === 'exchange-rates' && <ExchangeRatesTab />}
      {activeTab === 'system'         && <SystemTab departments={departments} deptsLoading={deptsLoading} />}
      {activeTab === 'audit-logs' && isSuperAdmin && <AuditLogsTab />}
    </div>
  );
}