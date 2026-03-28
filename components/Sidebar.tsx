
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  PanelLeftClose, PanelLeft, Search, LogOut, Plus,
  MoreHorizontal, Pencil, Trash2, Check, X, GripVertical,
  LayoutDashboard, CheckSquare, Wallet, Users, TrendingUp,
} from 'lucide-react';
import { DEPARTMENT_ICONS } from '@/lib/departments';
import { useAuth } from '@/lib/auth-context';
import AddDepartmentModal from '@/components/add-department-modal';

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 280;
const SIDEBAR_COLLAPSED = 68;

interface Department {
  id: string;
  name: string;
  icon: string;
  type: string;
  sort_order: number;
}

// Cycles through a palette of soft tile colors per department index
const TILE_COLORS = [
  { bg: 'bg-blue-100',    icon: 'text-blue-600'    },
  { bg: 'bg-violet-100',  icon: 'text-violet-600'  },
  { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
  { bg: 'bg-amber-100',   icon: 'text-amber-600'   },
  { bg: 'bg-rose-100',    icon: 'text-rose-600'    },
  { bg: 'bg-sky-100',     icon: 'text-sky-600'     },
  { bg: 'bg-teal-100',    icon: 'text-teal-600'    },
  { bg: 'bg-orange-100',  icon: 'text-orange-600'  },
  { bg: 'bg-pink-100',    icon: 'text-pink-600'    },
  { bg: 'bg-indigo-100',  icon: 'text-indigo-600'  },
];

// ─── Smooth pointer-based drag hook ─────────────────────────────────────────
function useSmoothDrag(
  items: Department[],
  onReorder: (next: Department[]) => void,
  enabled: boolean,
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overIndex,  setOverIndex]  = useState<number | null>(null);
  const [dragY,      setDragY]      = useState(0);
  const [startY,     setStartY]     = useState(0);
  const [itemHeight, setItemHeight] = useState(36);

  const listRef     = useRef<HTMLDivElement>(null);
  const originIndex = useRef<number>(-1);
  const frameRef    = useRef<number>(0);

  const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (!enabled) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const list = listRef.current;
    if (!list) return;

    const idx = items.findIndex(d => d.id === id);
    if (idx === -1) return;

    const rows = list.querySelectorAll<HTMLElement>('[data-drag-item]');
    const h    = rows[idx]?.offsetHeight ?? 36;
    setItemHeight(h);

    const listTop = list.getBoundingClientRect().top;
    originIndex.current = idx;

    setDraggingId(id);
    setOverIndex(idx);
    setStartY(e.clientY - listTop - idx * h);
    setDragY(e.clientY - listTop);

    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [enabled, items]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingId) return;
    const list = listRef.current;
    if (!list) return;

    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const listTop = list.getBoundingClientRect().top;
      const y = e.clientY - listTop;
      setDragY(y);
      const newOver = Math.max(0, Math.min(
        items.length - 1,
        Math.round((y - startY) / itemHeight),
      ));
      setOverIndex(newOver);
    });
  }, [draggingId, items.length, itemHeight, startY]);

  const onPointerUp = useCallback(() => {
    if (!draggingId || overIndex === null) {
      setDraggingId(null);
      setOverIndex(null);
      return;
    }
    const from = originIndex.current;
    const to   = overIndex;
    if (from !== to) {
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      onReorder(next);
    }
    setDraggingId(null);
    setOverIndex(null);
    cancelAnimationFrame(frameRef.current);
  }, [draggingId, overIndex, items, onReorder]);

  const getItemStyle = useCallback((index: number, id: string): React.CSSProperties => {
    if (!draggingId) {
      return { transition: 'transform 180ms cubic-bezier(0.25,0.46,0.45,0.94)' };
    }

    if (id === draggingId) {
      const from       = originIndex.current;
      const translateY = dragY - startY - from * itemHeight;
      return {
        transform:  `translateY(${translateY}px) scale(1.02)`,
        zIndex:     50,
        boxShadow:  '0 4px 20px rgba(0,0,0,0.13)',
        opacity:    1,
        transition: 'box-shadow 150ms, opacity 150ms',
        position:   'relative',
      };
    }

    const from = originIndex.current;
    const to   = overIndex ?? from;
    let shift  = 0;
    if (from < to) {
      if (index > from && index <= to) shift = -1;
    } else if (from > to) {
      if (index >= to && index < from) shift = 1;
    }

    return {
      transform:  shift !== 0 ? `translateY(${shift * itemHeight}px)` : 'translateY(0)',
      transition: 'transform 180ms cubic-bezier(0.25,0.46,0.45,0.94)',
      opacity:    1,
    };
  }, [draggingId, dragY, startY, itemHeight, overIndex]);

  return { draggingId, listRef, getItemStyle, onPointerDown, onPointerMove, onPointerUp };
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const [collapsed,    setCollapsed]    = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [isResizing,   setIsResizing]   = useState(false);
  const [search,       setSearch]       = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [departments,  setDepartments]  = useState<Department[]>([]);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [menuOpenId,   setMenuOpenId]   = useState<string | null>(null);
  const [editingId,    setEditingId]    = useState<string | null>(null);
  const [editingName,  setEditingName]  = useState('');

  const editInputRef = useRef<HTMLInputElement>(null);
  const saveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname     = usePathname();
  const router       = useRouter();
  const { canAccessDepartment, signOut, profile, loading } = useAuth();

  const isAdmin = profile?.role === 'admin';

  // ── Drag-to-resize ──────────────────────────────────────────────────────
  const onResizePointerDown = useCallback((e: React.PointerEvent) => {
    if (collapsed) return;
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startW = sidebarWidth;

    const onMove = (ev: PointerEvent) => {
      const newW = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW + ev.clientX - startX));
      setSidebarWidth(newW);
    };
    const onUp = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [collapsed, sidebarWidth]);

  // Prevent text selection while dragging
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      if (!res.ok) throw new Error('Failed to fetch');
      setDepartments(await res.json());
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setDeptsLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const persistOrder = useCallback(async (ordered: Department[]) => {
    try {
      await fetch('/api/departments/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ordered.map(d => d.id) }),
      });
    } catch (err) {
      console.error('Failed to save department order:', err);
    }
  }, []);

  const handleReorder = useCallback((next: Department[]) => {
    setDepartments(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistOrder(next), 400);
  }, [persistOrder]);

  // Top-level nav items (not department-bound)
  const TOP_NAV = useMemo(() => [
    { id: 'dashboard',        label: 'Dashboard',  icon: LayoutDashboard },
    { id: 'tasks-daily-goals', label: 'All Tasks',  icon: CheckSquare     },
    { id: 'expenses-global',  label: 'All Expenses', icon: Wallet         },
    { id: 'team-members',     label: 'Team',       icon: Users           },
    { id: 'net-profit',       label: 'Net Profit', icon: TrendingUp      },
  ], []);

  // Department items (only standard/gmb/influencers/restock types)
  const mainDepts = useMemo(() => departments.filter(d => {
    if (!['standard', 'gmb', 'influencers', 'restock'].includes(d.type)) return false;
    if (loading) return true;
    if (!canAccessDepartment(d.id)) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [departments, loading, canAccessDepartment, search]);

  const dragEnabled = isAdmin && !collapsed && !search && !editingId;

  const { draggingId, listRef, getItemStyle, onPointerDown, onPointerMove, onPointerUp } =
    useSmoothDrag(mainDepts, handleReorder, dragEnabled);

  useEffect(() => {
    if (!menuOpenId) return;
    const handler = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-dept-menu]')) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpenId]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const getHref  = (id: string) => id === 'dashboard' ? '/dashboard' : `/dashboard/${id}`;
  const isActive = (id: string) => id === 'dashboard' ? pathname === '/dashboard' : pathname === `/dashboard/${id}`;

  const startEdit  = (dept: Department) => { setEditingId(dept.id); setEditingName(dept.name); setMenuOpenId(null); };
  const cancelEdit = () => { setEditingId(null); setEditingName(''); };

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
  const adminDept    = departments.find(d => d.id === 'admin');
  const showAdmin    = !loading && adminDept && canAccessDepartment('admin') &&
    (!search || 'admin panel'.includes(search.toLowerCase()));

  return (
    <>
      <aside
        className={`relative flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 shrink-0 ${isResizing ? '' : 'transition-[width] duration-200'}`}
        style={{ width: collapsed ? SIDEBAR_COLLAPSED : sidebarWidth }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 shrink-0">
          {!collapsed && <span className="font-bold text-gray-900 text-base tracking-tight">Business Hub</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors">
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
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {isLoadingAny ? (
            <div className="space-y-1 px-1">
              {[...Array(8)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* ── Top-level navigation ── */}
              <div className="mb-1">
                {!collapsed && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2.5 mb-1.5">Main</p>}
                {TOP_NAV.map(item => {
                  const active = isActive(item.id);
                  const NavIcon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={getHref(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors mb-0.5 ${
                        active ? 'bg-[#3b82f6] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <NavIcon size={16} className={active ? 'text-white' : 'text-gray-400'} />
                      {!collapsed && <span className="text-[13px] font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>

              {/* ── Departments section ── */}
              <div className={`mt-2 mb-1.5 ${collapsed ? 'px-1' : 'px-2'}`}>
                <div className="border-t border-gray-200" />
                {!collapsed && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pt-2 px-0.5">Departments</p>}
              </div>
              <div
                ref={listRef}
                className="relative"
                style={{ userSelect: draggingId ? 'none' : undefined }}
                onPointerMove={draggingId ? onPointerMove : undefined}
                onPointerUp={draggingId ? onPointerUp : undefined}
                onPointerLeave={draggingId ? onPointerUp : undefined}
              >
                {mainDepts.map((dept, index) => {
                  const Icon      = DEPARTMENT_ICONS[dept.icon];
                  const active    = isActive(dept.id);
                  const isEditing = editingId === dept.id;
                  const menuOpen  = menuOpenId === dept.id;
                  const isDragged = draggingId === dept.id;
                  const tile      = TILE_COLORS[index % TILE_COLORS.length];

                  return (
                    <div
                      key={dept.id}
                      data-drag-item
                      className="group/item mb-0.5 rounded-lg border-b border-gray-100 last:border-b-0"
                      style={getItemStyle(index, dept.id)}
                    >
                      {isEditing ? (
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
                          <button onClick={() => commitEdit(dept.id)} className="p-0.5 text-emerald-500 hover:text-emerald-700 shrink-0"><Check size={14} /></button>
                          <button onClick={cancelEdit} className="p-0.5 text-gray-400 hover:text-gray-600 shrink-0"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className={`flex items-center rounded-lg transition-colors ${
                          active    ? 'bg-[#3b82f6]' :
                          isDragged ? 'bg-gray-100 ring-1 ring-gray-200' :
                                      'hover:bg-gray-50'
                        }`}>

                          {/* Grip handle */}
                          {dragEnabled && (
                            <div
                              className={`pl-1 py-2 shrink-0 touch-none transition-opacity duration-150 cursor-grab active:cursor-grabbing flex items-center ${
                                isDragged ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'
                              }`}
                              onPointerDown={e => onPointerDown(e, dept.id)}
                            >
                              <GripVertical size={13} className={active ? 'text-white/50' : 'text-gray-300'} />
                            </div>
                          )}

                          <Link
                            href={getHref(dept.id)}
                            className={`flex items-center gap-2 px-2 py-1.5 text-sm flex-1 min-w-0 ${active ? 'text-white' : 'text-gray-700 hover:text-gray-900'}`}
                            title={collapsed ? dept.name : undefined}
                            onClick={e => { if (draggingId) e.preventDefault(); }}
                          >
                            {/* Colored tile icon */}
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                              active ? 'bg-white/20' : tile.bg
                            }`}>
                              {Icon && <Icon size={13} className={active ? 'text-white' : tile.icon} />}
                            </div>
                            {/* Name wraps instead of truncating */}
                            {!collapsed && (
                              <span className="break-words whitespace-normal leading-snug text-[13px]">
                                {dept.name}
                              </span>
                            )}
                          </Link>

                          {isAdmin && !collapsed && (
                            <div className="relative shrink-0 pr-1" data-dept-menu>
                              <button
                                onClick={e => { e.preventDefault(); setMenuOpenId(menuOpen ? null : dept.id); }}
                                className={`p-1 rounded-md transition-all ${
                                  menuOpen
                                    ? 'opacity-100 bg-black/10'
                                    : active
                                      ? 'opacity-0 group-hover/item:opacity-100 text-white hover:bg-white/20'
                                      : 'opacity-0 group-hover/item:opacity-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                <MoreHorizontal size={14} />
                              </button>
                              {menuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden py-1">
                                  <button onClick={() => startEdit(dept)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                                    <Pencil size={12} className="text-gray-400" /> Rename
                                  </button>
                                  <button onClick={() => handleDelete(dept.id)} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                                    <Trash2 size={12} /> Delete
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
              </div>

              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  title={collapsed ? 'Add Department' : undefined}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors w-full mt-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600 border border-dashed border-gray-200 hover:border-blue-300 ${collapsed ? 'justify-center' : ''}`}
                >
                  <Plus size={16} />
                  {!collapsed && <span>Add Department</span>}
                </button>
              )}

              {showAdmin && adminDept && (
                <>
                  <div className={`mt-3 mb-1 ${collapsed ? 'px-1' : 'px-2'}`}>
                    <div className="border-t border-gray-200" />
                    {!collapsed && <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pt-2 px-0.5">Administration</p>}
                  </div>
                  {(() => {
                    const Icon   = DEPARTMENT_ICONS[adminDept.icon];
                    const active = isActive(adminDept.id);
                    return (
                      <Link
                        href={getHref(adminDept.id)}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors group ${active ? 'bg-[#3b82f6] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        title={collapsed ? adminDept.name : undefined}
                      >
                        {Icon && <Icon size={18} className={active ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />}
                        {!collapsed && (
                          <span className="break-words whitespace-normal leading-snug">
                            {adminDept.name}
                          </span>
                        )}
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
          {!collapsed && profile && <div className="text-xs text-gray-500 mb-2 truncate px-1">{profile.email}</div>}
          <button
            onClick={signOut}
            className={`flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors w-full ${collapsed ? 'justify-center' : ''}`}
            title="Sign out"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>

        {/* Resize handle — drag to adjust width */}
        {!collapsed && (
          <div
            onPointerDown={onResizePointerDown}
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize group z-10 ${isResizing ? 'bg-blue-300' : ''}`}
            title="Drag to resize"
          >
            <div className={`absolute inset-y-0 right-0 w-1 transition-colors ${
              isResizing ? 'bg-blue-400' : 'bg-transparent group-hover:bg-blue-300'
            }`} />
          </div>
        )}
      </aside>

      <AddDepartmentModal open={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchDepartments} />
    </>
  );
}