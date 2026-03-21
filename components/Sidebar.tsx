// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { PanelLeftClose, PanelLeft, Search, LogOut } from 'lucide-react';
// import { DEPARTMENTS, DEPARTMENT_ICONS } from '@/lib/departments';
// import { useAuth } from '@/lib/auth-context';

// export default function Sidebar() {
//   const [collapsed, setCollapsed] = useState(false);
//   const [search, setSearch] = useState('');
//   const pathname = usePathname();
//   const { canAccessDepartment, signOut, profile, loading } = useAuth();

//   const getHref = (id: string) => {
//     if (id === 'dashboard') return '/dashboard';
//     return `/dashboard/${id}`;
//   };

//   const isActive = (id: string) => {
//     if (id === 'dashboard') return pathname === '/dashboard';
//     return pathname === `/dashboard/${id}`;
//   };

//   const mainDepts = DEPARTMENTS.filter(d => {
//     if (d.id === 'admin') return false;
//     if (loading) return true;
//     if (!canAccessDepartment(d.id)) return false;
//     if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
//     return true;
//   });

//   const adminDept = DEPARTMENTS.find(d => d.id === 'admin');
//   const showAdmin = !loading && adminDept && canAccessDepartment('admin') && (!search || 'admin panel'.includes(search.toLowerCase()));

//   return (
//     <aside
//       className={`flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-200 ${
//         collapsed ? 'w-[68px]' : 'w-[260px]'
//       }`}
//     >
//       <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 shrink-0">
//         {!collapsed && (
//           <span className="font-bold text-gray-900 text-base tracking-tight">Business Hub</span>
//         )}
//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
//         >
//           {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
//         </button>
//       </div>

//       {!collapsed && (
//         <div className="px-3 py-2 border-b border-gray-100">
//           <div className="relative">
//             <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search departments..."
//               value={search}
//               onChange={e => setSearch(e.target.value)}
//               className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none"
//             />
//           </div>
//         </div>
//       )}

//       <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
//         {loading ? (
//           <div className="space-y-1 px-1">
//             {[...Array(8)].map((_, i) => (
//               <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
//             ))}
//           </div>
//         ) : (
//           <>
//             {mainDepts.map(dept => {
//               const Icon = DEPARTMENT_ICONS[dept.icon];
//               const active = isActive(dept.id);
//               return (
//                 <Link
//                   key={dept.id}
//                   href={getHref(dept.id)}
//                   className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group ${
//                     active
//                       ? 'bg-[#3b82f6] text-white'
//                       : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
//                   }`}
//                   title={collapsed ? dept.name : undefined}
//                 >
//                   {Icon && <Icon size={18} className={active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />}
//                   {!collapsed && <span className="truncate">{dept.name}</span>}
//                 </Link>
//               );
//             })}

//             {showAdmin && adminDept && (
//               <>
//                 <div className={`mt-3 mb-1 ${collapsed ? 'px-1' : 'px-2'}`}>
//                   <div className="border-t border-gray-200" />
//                   {!collapsed && (
//                     <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pt-2 px-0.5">
//                       Administration
//                     </p>
//                   )}
//                 </div>
//                 {(() => {
//                   const Icon = DEPARTMENT_ICONS[adminDept.icon];
//                   const active = isActive(adminDept.id);
//                   return (
//                     <Link
//                       href={getHref(adminDept.id)}
//                       className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group ${
//                         active
//                           ? 'bg-[#3b82f6] text-white'
//                           : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
//                       }`}
//                       title={collapsed ? adminDept.name : undefined}
//                     >
//                       {Icon && <Icon size={18} className={active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />}
//                       {!collapsed && <span className="truncate">{adminDept.name}</span>}
//                     </Link>
//                   );
//                 })()}
//               </>
//             )}
//           </>
//         )}
//       </nav>

//       <div className="border-t border-gray-200 p-3 shrink-0">
//         {!collapsed && profile && (
//           <div className="text-xs text-gray-500 mb-2 truncate px-1">
//             {profile.email}
//           </div>
//         )}
//         <button
//           onClick={signOut}
//           className={`flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors w-full ${
//             collapsed ? 'justify-center' : ''
//           }`}
//           title="Sign out"
//         >
//           <LogOut size={16} />
//           {!collapsed && <span>Sign out</span>}
//         </button>
//       </div>
//     </aside>
//   );
// }






// 'use client';

// import { useState, useEffect, useCallback, useRef } from 'react';
// import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation';
// import { PanelLeftClose, PanelLeft, Search, LogOut, Plus, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';
// import { DEPARTMENT_ICONS } from '@/lib/departments';
// import { supabase } from '@/lib/supabase';
// import { useAuth } from '@/lib/auth-context';
// import AddDepartmentModal from '@/components/add-department-modal';

// interface Department {
//   id: string;
//   name: string;
//   icon: string;
//   type: string;
//   sort_order: number;
// }

// export default function Sidebar() {
//   const [collapsed, setCollapsed] = useState(false);
//   const [search, setSearch] = useState('');
//   const [showAddModal, setShowAddModal] = useState(false);
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [deptsLoading, setDeptsLoading] = useState(true);
//   const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editingName, setEditingName] = useState('');
//   const editInputRef = useRef<HTMLInputElement>(null);
//   const pathname = usePathname();
//   const router = useRouter();
//   const { canAccessDepartment, signOut, profile, loading } = useAuth();

//   const isAdmin = profile?.role === 'admin';

//   const fetchDepartments = useCallback(async () => {
//     const { data } = await supabase
//       .from('departments')
//       .select('*')
//       .order('sort_order', { ascending: true });
//     if (data) setDepartments(data);
//     setDeptsLoading(false);
//   }, []);

//   useEffect(() => {
//     fetchDepartments();
//   }, [fetchDepartments]);

//   // Close menu on outside click
//   useEffect(() => {
//     if (!menuOpenId) return;
//     const handler = (e: MouseEvent) => {
//       const target = e.target as HTMLElement;
//       if (!target.closest('[data-dept-menu]')) setMenuOpenId(null);
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, [menuOpenId]);

//   // Focus input when editing starts
//   useEffect(() => {
//     if (editingId && editInputRef.current) {
//       editInputRef.current.focus();
//       editInputRef.current.select();
//     }
//   }, [editingId]);

//   const getHref = (id: string) => {
//     if (id === 'dashboard') return '/dashboard';
//     return `/dashboard/${id}`;
//   };

//   const isActive = (id: string) => {
//     if (id === 'dashboard') return pathname === '/dashboard';
//     return pathname === `/dashboard/${id}`;
//   };

//   const startEdit = (dept: Department) => {
//     setEditingId(dept.id);
//     setEditingName(dept.name);
//     setMenuOpenId(null);
//   };

//   const cancelEdit = () => {
//     setEditingId(null);
//     setEditingName('');
//   };

//   const commitEdit = async (id: string) => {
//     const trimmed = editingName.trim();
//     if (!trimmed) { cancelEdit(); return; }

//     setDepartments(prev => prev.map(d => d.id === id ? { ...d, name: trimmed } : d));
//     cancelEdit();

//     await supabase.from('departments').update({ name: trimmed }).eq('id', id);
//   };

//   const handleDelete = async (id: string) => {
//     setMenuOpenId(null);
//     if (!confirm(`Delete department "${departments.find(d => d.id === id)?.name}"? This cannot be undone.`)) return;
//     setDepartments(prev => prev.filter(d => d.id !== id));
//     await supabase.from('departments').delete().eq('id', id);
//     if (pathname === `/dashboard/${id}`) router.push('/dashboard');
//   };

//   const isLoadingAny = loading || deptsLoading;

//   const mainDepts = departments.filter(d => {
//     if (d.id === 'admin') return false;
//     if (loading) return true;
//     if (!canAccessDepartment(d.id)) return false;
//     if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
//     return true;
//   });

//   const adminDept = departments.find(d => d.id === 'admin');
//   const showAdmin =
//     !loading &&
//     adminDept &&
//     canAccessDepartment('admin') &&
//     (!search || 'admin panel'.includes(search.toLowerCase()));

//   return (
//     <>
//       <aside
//         className={`flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-200 ${
//           collapsed ? 'w-[68px]' : 'w-[260px]'
//         }`}
//       >
//         {/* Header */}
//         <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 shrink-0">
//           {!collapsed && (
//             <span className="font-bold text-gray-900 text-base tracking-tight">Business Hub</span>
//           )}
//           <button
//             onClick={() => setCollapsed(!collapsed)}
//             className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
//           >
//             {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
//           </button>
//         </div>

//         {/* Search */}
//         {!collapsed && (
//           <div className="px-3 py-2 border-b border-gray-100">
//             <div className="relative">
//               <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search departments..."
//                 value={search}
//                 onChange={e => setSearch(e.target.value)}
//                 className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none"
//               />
//             </div>
//           </div>
//         )}

//         {/* Nav */}
//         <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
//           {isLoadingAny ? (
//             <div className="space-y-1 px-1">
//               {[...Array(8)].map((_, i) => (
//                 <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
//               ))}
//             </div>
//           ) : (
//             <>
//               {mainDepts.map(dept => {
//                 const Icon = DEPARTMENT_ICONS[dept.icon];
//                 const active = isActive(dept.id);
//                 const isEditing = editingId === dept.id;
//                 const menuOpen = menuOpenId === dept.id;

//                 return (
//                   <div key={dept.id} className="relative group/item">
//                     {isEditing ? (
//                       // ── Edit mode ──
//                       <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
//                         {Icon && <Icon size={16} className="text-blue-400 shrink-0" />}
//                         <input
//                           ref={editInputRef}
//                           value={editingName}
//                           onChange={e => setEditingName(e.target.value)}
//                           onKeyDown={e => {
//                             if (e.key === 'Enter') commitEdit(dept.id);
//                             if (e.key === 'Escape') cancelEdit();
//                           }}
//                           className="flex-1 text-sm bg-transparent outline-none text-gray-900 min-w-0"
//                         />
//                         <button onClick={() => commitEdit(dept.id)} className="p-0.5 text-emerald-500 hover:text-emerald-700 shrink-0">
//                           <Check size={14} />
//                         </button>
//                         <button onClick={cancelEdit} className="p-0.5 text-gray-400 hover:text-gray-600 shrink-0">
//                           <X size={14} />
//                         </button>
//                       </div>
//                     ) : (
//                       // ── Normal mode ──
//                       <div className={`flex items-center rounded-lg transition-colors ${
//                         active ? 'bg-[#3b82f6]' : 'hover:bg-gray-50'
//                       }`}>
//                         <Link
//                           href={getHref(dept.id)}
//                           className={`flex items-center gap-2.5 px-2.5 py-2 text-sm flex-1 min-w-0 ${
//                             active ? 'text-white' : 'text-gray-600 hover:text-gray-900'
//                           }`}
//                           title={collapsed ? dept.name : undefined}
//                         >
//                           {Icon && (
//                             <Icon size={18} className={`shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover/item:text-gray-600'}`} />
//                           )}
//                           {!collapsed && <span className="truncate">{dept.name}</span>}
//                         </Link>

//                         {/* ⋯ Menu button — admin only, visible on hover */}
//                         {isAdmin && !collapsed && (
//                           <div className="relative shrink-0 pr-1" data-dept-menu>
//                             <button
//                               onClick={e => {
//                                 e.preventDefault();
//                                 setMenuOpenId(menuOpen ? null : dept.id);
//                               }}
//                               className={`p-1 rounded-md transition-all ${
//                                 menuOpen
//                                   ? 'opacity-100 bg-black/10 text-white'
//                                   : active
//                                     ? 'opacity-0 group-hover/item:opacity-100 text-white hover:bg-white/20'
//                                     : 'opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200'
//                               }`}
//                             >
//                               <MoreHorizontal size={14} />
//                             </button>

//                             {/* Dropdown */}
//                             {menuOpen && (
//                               <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden py-1">
//                                 <button
//                                   onClick={() => startEdit(dept)}
//                                   className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
//                                 >
//                                   <Pencil size={12} className="text-gray-400" />
//                                   Rename
//                                 </button>
//                                 <button
//                                   onClick={() => handleDelete(dept.id)}
//                                   className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
//                                 >
//                                   <Trash2 size={12} />
//                                   Delete
//                                 </button>
//                               </div>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}

//               {/* Add Department button — admin only */}
//               {isAdmin && (
//                 <button
//                   onClick={() => setShowAddModal(true)}
//                   title={collapsed ? 'Add Department' : undefined}
//                   className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors w-full mt-1
//                     text-gray-400 hover:bg-blue-50 hover:text-blue-600 border border-dashed border-gray-200 hover:border-blue-300
//                     ${collapsed ? 'justify-center' : ''}`}
//                 >
//                   <Plus size={16} />
//                   {!collapsed && <span>Add Department</span>}
//                 </button>
//               )}

//               {showAdmin && adminDept && (
//                 <>
//                   <div className={`mt-3 mb-1 ${collapsed ? 'px-1' : 'px-2'}`}>
//                     <div className="border-t border-gray-200" />
//                     {!collapsed && (
//                       <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pt-2 px-0.5">
//                         Administration
//                       </p>
//                     )}
//                   </div>
//                   {(() => {
//                     const Icon = DEPARTMENT_ICONS[adminDept.icon];
//                     const active = isActive(adminDept.id);
//                     return (
//                       <Link
//                         href={getHref(adminDept.id)}
//                         className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group ${
//                           active
//                             ? 'bg-[#3b82f6] text-white'
//                             : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
//                         }`}
//                         title={collapsed ? adminDept.name : undefined}
//                       >
//                         {Icon && (
//                           <Icon size={18} className={active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
//                         )}
//                         {!collapsed && <span className="truncate">{adminDept.name}</span>}
//                       </Link>
//                     );
//                   })()}
//                 </>
//               )}
//             </>
//           )}
//         </nav>

//         {/* Footer */}
//         <div className="border-t border-gray-200 p-3 shrink-0">
//           {!collapsed && profile && (
//             <div className="text-xs text-gray-500 mb-2 truncate px-1">{profile.email}</div>
//           )}
//           <button
//             onClick={signOut}
//             className={`flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors w-full ${
//               collapsed ? 'justify-center' : ''
//             }`}
//             title="Sign out"
//           >
//             <LogOut size={16} />
//             {!collapsed && <span>Sign out</span>}
//           </button>
//         </div>
//       </aside>

//       <AddDepartmentModal
//         open={showAddModal}
//         onClose={() => setShowAddModal(false)}
//         onSuccess={fetchDepartments}
//       />
//     </>
//   );
// }




'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PanelLeftClose, PanelLeft, Search, LogOut, Plus, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react';
import { DEPARTMENT_ICONS } from '@/lib/departments';
import { useAuth } from '@/lib/auth-context';
import AddDepartmentModal from '@/components/add-department-modal';

interface Department {
  id: string;
  name: string;
  icon: string;
  type: string;
  sort_order: number;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { canAccessDepartment, signOut, profile, loading } = useAuth();

  const isAdmin = profile?.role === 'admin';

const fetchDepartments = useCallback(async () => {
  try {
    const res = await fetch('/api/departments');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    setDepartments(data);
  } catch (err) {
    console.error('Failed to fetch departments:', err);
  } finally {
    setDeptsLoading(false);
  }
}, []);


  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpenId) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dept-menu]')) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpenId]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const getHref = (id: string) => {
    if (id === 'dashboard') return '/dashboard';
    return `/dashboard/${id}`;
  };

  const isActive = (id: string) => {
    if (id === 'dashboard') return pathname === '/dashboard';
    return pathname === `/dashboard/${id}`;
  };

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setEditingName(dept.name);
    setMenuOpenId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

const commitEdit = async (id: string) => {
  const trimmed = editingName.trim();
  if (!trimmed) { cancelEdit(); return; }

  setDepartments(prev => prev.map(d => d.id === id ? { ...d, name: trimmed } : d));
  cancelEdit();

  await fetch(`/api/departments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: trimmed }),
  });
};


const handleDelete = async (id: string) => {
  setMenuOpenId(null);
  if (!confirm(`Delete department "${departments.find(d => d.id === id)?.name}"? This cannot be undone.`)) return;
  setDepartments(prev => prev.filter(d => d.id !== id));
  await fetch(`/api/departments/${id}`, { method: 'DELETE' });
  if (pathname === `/dashboard/${id}`) router.push('/dashboard');
};

  const isLoadingAny = loading || deptsLoading;

  const mainDepts = departments.filter(d => {
    if (d.id === 'admin') return false;
    if (loading) return true;
    if (!canAccessDepartment(d.id)) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const adminDept = departments.find(d => d.id === 'admin');
  const showAdmin =
    !loading &&
    adminDept &&
    canAccessDepartment('admin') &&
    (!search || 'admin panel'.includes(search.toLowerCase()));

  return (
    <>
      <aside
        className={`flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-200 ${
          collapsed ? 'w-[68px]' : 'w-[260px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 shrink-0">
          {!collapsed && (
            <span className="font-bold text-gray-900 text-base tracking-tight">Business Hub</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
          >
            {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search departments..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none"
              />
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {isLoadingAny ? (
            <div className="space-y-1 px-1">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {mainDepts.map(dept => {
                const Icon = DEPARTMENT_ICONS[dept.icon];
                const active = isActive(dept.id);
                const isEditing = editingId === dept.id;
                const menuOpen = menuOpenId === dept.id;

                return (
                  <div key={dept.id} className="relative group/item">
                    {isEditing ? (
                      // ── Edit mode ──
                      <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                        {Icon && <Icon size={16} className="text-blue-400 shrink-0" />}
                        <input
                          ref={editInputRef}
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitEdit(dept.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="flex-1 text-sm bg-transparent outline-none text-gray-900 min-w-0"
                        />
                        <button onClick={() => commitEdit(dept.id)} className="p-0.5 text-emerald-500 hover:text-emerald-700 shrink-0">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelEdit} className="p-0.5 text-gray-400 hover:text-gray-600 shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      // ── Normal mode ──
                      <div className={`flex items-center rounded-lg transition-colors ${
                        active ? 'bg-[#3b82f6]' : 'hover:bg-gray-50'
                      }`}>
                        <Link
                          href={getHref(dept.id)}
                          className={`flex items-center gap-2.5 px-2.5 py-2 text-sm flex-1 min-w-0 ${
                            active ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                          }`}
                          title={collapsed ? dept.name : undefined}
                        >
                          {Icon && (
                            <Icon size={18} className={`shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover/item:text-gray-600'}`} />
                          )}
                          {!collapsed && <span className="truncate">{dept.name}</span>}
                        </Link>

                        {/* ⋯ Menu button — admin only, visible on hover */}
                        {isAdmin && !collapsed && (
                          <div className="relative shrink-0 pr-1" data-dept-menu>
                            <button
                              onClick={e => {
                                e.preventDefault();
                                setMenuOpenId(menuOpen ? null : dept.id);
                              }}
                              className={`p-1 rounded-md transition-all ${
                                menuOpen
                                  ? 'opacity-100 bg-black/10 text-white'
                                  : active
                                    ? 'opacity-0 group-hover/item:opacity-100 text-white hover:bg-white/20'
                                    : 'opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <MoreHorizontal size={14} />
                            </button>

                            {/* Dropdown */}
                            {menuOpen && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden py-1">
                                <button
                                  onClick={() => startEdit(dept)}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Pencil size={12} className="text-gray-400" />
                                  Rename
                                </button>
                                <button
                                  onClick={() => handleDelete(dept.id)}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Department button — admin only */}
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  title={collapsed ? 'Add Department' : undefined}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors w-full mt-1
                    text-gray-400 hover:bg-blue-50 hover:text-blue-600 border border-dashed border-gray-200 hover:border-blue-300
                    ${collapsed ? 'justify-center' : ''}`}
                >
                  <Plus size={16} />
                  {!collapsed && <span>Add Department</span>}
                </button>
              )}

              {showAdmin && adminDept && (
                <>
                  <div className={`mt-3 mb-1 ${collapsed ? 'px-1' : 'px-2'}`}>
                    <div className="border-t border-gray-200" />
                    {!collapsed && (
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pt-2 px-0.5">
                        Administration
                      </p>
                    )}
                  </div>
                  {(() => {
                    const Icon = DEPARTMENT_ICONS[adminDept.icon];
                    const active = isActive(adminDept.id);
                    return (
                      <Link
                        href={getHref(adminDept.id)}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group ${
                          active
                            ? 'bg-[#3b82f6] text-white'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        title={collapsed ? adminDept.name : undefined}
                      >
                        {Icon && (
                          <Icon size={18} className={active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                        )}
                        {!collapsed && <span className="truncate">{adminDept.name}</span>}
                      </Link>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 shrink-0">
          {!collapsed && profile && (
            <div className="text-xs text-gray-500 mb-2 truncate px-1">{profile.email}</div>
          )}
          <button
            onClick={signOut}
            className={`flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors w-full ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Sign out"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <AddDepartmentModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchDepartments}
      />
    </>
  );
}

