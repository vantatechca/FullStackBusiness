'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeft, Search, LogOut } from 'lucide-react';
import { DEPARTMENTS, DEPARTMENT_ICONS } from '@/lib/departments';
import { useAuth } from '@/lib/auth-context';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const pathname = usePathname();
  const { canAccessDepartment, signOut, profile, loading } = useAuth();

  const getHref = (id: string) => {
    if (id === 'dashboard') return '/dashboard';
    return `/dashboard/${id}`;
  };

  const isActive = (id: string) => {
    if (id === 'dashboard') return pathname === '/dashboard';
    return pathname === `/dashboard/${id}`;
  };

  const mainDepts = DEPARTMENTS.filter(d => {
    if (d.id === 'admin') return false;
    if (loading) return true;
    if (!canAccessDepartment(d.id)) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const adminDept = DEPARTMENTS.find(d => d.id === 'admin');
  const showAdmin = !loading && adminDept && canAccessDepartment('admin') && (!search || 'admin panel'.includes(search.toLowerCase()));

  return (
    <aside
      className={`flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-200 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
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

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {loading ? (
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
              return (
                <Link
                  key={dept.id}
                  href={getHref(dept.id)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group ${
                    active
                      ? 'bg-[#3b82f6] text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  title={collapsed ? dept.name : undefined}
                >
                  {Icon && <Icon size={18} className={active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />}
                  {!collapsed && <span className="truncate">{dept.name}</span>}
                </Link>
              );
            })}

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
                      {Icon && <Icon size={18} className={active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />}
                      {!collapsed && <span className="truncate">{adminDept.name}</span>}
                    </Link>
                  );
                })()}
              </>
            )}
          </>
        )}
      </nav>

      <div className="border-t border-gray-200 p-3 shrink-0">
        {!collapsed && profile && (
          <div className="text-xs text-gray-500 mb-2 truncate px-1">
            {profile.email}
          </div>
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
  );
}
