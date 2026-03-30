'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import {
  ArrowUpRight, ArrowDownRight, Minus, Plus, X, ChevronDown, ChevronRight,
  Pencil, Trash2, RefreshCw, BarChart3, Check, GripVertical, Calendar, ChevronLeft,
} from 'lucide-react';
import type { Asset, AssetDailyLog, Department } from '@/lib/types';
import { useDragReorder } from '@/lib/use-drag-reorder';

const PALETTE = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-amber-500', 'bg-teal-500', 'bg-orange-500', 'bg-sky-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-lime-500', 'bg-cyan-500',
];

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all";
const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";
const selectCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white";

// Generate last N days as YYYY-MM-DD strings
function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return days;
}

export default function AssetsView() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [dailyLogs, setDailyLogs] = useState<AssetDailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [snapshotting, setSnapshotting] = useState(false);
  const [calendarAssetId, setCalendarAssetId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Category notes + sort order
  const [catNotes, setCatNotes] = useState<Record<string, string>>({});
  const [catSortOrder, setCatSortOrder] = useState<Record<string, number>>({});
  const [editingCatNote, setEditingCatNote] = useState<string | null>(null);
  const [catNoteDraft, setCatNoteDraft] = useState('');

  // Form
  const [formCategory, setFormCategory] = useState('');
  const [formCategoryCustom, setFormCategoryCustom] = useState(false);
  const [formMetric, setFormMetric] = useState('');
  const [formValue, setFormValue] = useState('0');
  const [formDirection, setFormDirection] = useState<'up_good' | 'down_good'>('up_good');
  const [formTracking, setFormTracking] = useState<'total' | 'daily'>('total');
  const [formNotes, setFormNotes] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState<string>('');
  const [formSortOrder, setFormSortOrder] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  // Departments for optional assignment
  const [departments, setDepartments] = useState<Department[]>([]);

  const last30 = useMemo(() => getLast30Days(), []);
  const deptMap = useMemo(() => {
    const m: Record<string, string> = {};
    departments.forEach(d => { m[d.id] = d.name; });
    return m;
  }, [departments]);

  const fetchAssets = useCallback(async () => {
    try {
      const [aRes, lRes, nRes] = await Promise.all([
        fetch('/api/assets'),
        fetch('/api/asset-daily-logs'),
        fetch('/api/asset-category-notes'),
      ]);
      if (aRes.ok) { const d = await aRes.json(); setAssets(Array.isArray(d) ? d : []); }
      if (lRes.ok) { const d = await lRes.json(); setDailyLogs(Array.isArray(d) ? d : []); }
      if (nRes.ok) {
        const d = await nRes.json();
        const noteMap: Record<string, string> = {};
        const orderMap: Record<string, number> = {};
        if (Array.isArray(d)) d.forEach((n: any) => {
          noteMap[n.category] = n.notes || '';
          if (n.sort_order != null) orderMap[n.category] = Number(n.sort_order);
        });
        setCatNotes(noteMap);
        setCatSortOrder(orderMap);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  // Fetch departments once
  useEffect(() => {
    fetch('/api/table-data?table=departments')
      .then(r => r.ok ? r.json() : [])
      .then(d => { if (Array.isArray(d)) setDepartments(d.filter((dept: any) => dept.type === 'standard' || dept.type === 'gmb' || dept.type === 'influencers' || dept.type === 'restock').sort((a: any, b: any) => a.sort_order - b.sort_order)); })
      .catch(() => {});
  }, []);

  // Build a lookup: asset_id → { date → value }
  const logMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    dailyLogs.forEach(l => {
      if (!map[l.asset_id]) map[l.asset_id] = {};
      const d = l.date.split('T')[0]; // normalize
      map[l.asset_id][d] = Number(l.value) || 0;
    });
    return map;
  }, [dailyLogs]);

  // Unique categories derived from data, ordered by catNotes sort_order then asset sort_order
  const categories = useMemo(() => {
    const seen = new Map<string, number>(); // category → min sort_order from assets
    assets.forEach(a => {
      const cat = a.category || 'Other';
      if (!seen.has(cat) || a.sort_order < (seen.get(cat) ?? Infinity)) seen.set(cat, a.sort_order);
    });
    return Array.from(seen.keys()).sort((a, b) => {
      const aOrder = catSortOrder[a] ?? 999;
      const bOrder = catSortOrder[b] ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (seen.get(a) ?? 0) - (seen.get(b) ?? 0);
    });
  }, [assets, catSortOrder]);

  // Auto-assign colors from palette based on category order
  const catColor = useCallback((cat: string) => {
    const idx = categories.indexOf(cat);
    return PALETTE[(idx >= 0 ? idx : categories.length) % PALETTE.length];
  }, [categories]);

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, { totals: Asset[]; dailies: Asset[] }> = {};
    assets.forEach(a => {
      const cat = a.category || 'Other';
      if (!map[cat]) map[cat] = { totals: [], dailies: [] };
      if (a.tracking === 'daily') map[cat].dailies.push(a);
      else map[cat].totals.push(a);
    });
    // Sort by category order
    return Object.entries(map).sort(([a], [b]) => {
      const ai = categories.indexOf(a);
      const bi = categories.indexOf(b);
      return ai - bi;
    });
  }, [assets, categories]);

  // Drag-to-reorder categories
  const categoryItems = useMemo(() =>
    grouped.map(([cat]) => ({ id: cat })),
    [grouped],
  );

  const handleCatReorder = useCallback(async (next: { id: string }[]) => {
    const newOrder: Record<string, number> = {};
    next.forEach((item, i) => { newOrder[item.id] = i; });
    setCatSortOrder(newOrder);
    try {
      await fetch('/api/asset-category-notes', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: next.map(n => n.id) }),
      });
    } catch { toast.error('Failed to save order'); }
  }, []);

  const {
    draggingId: dragCatId, listRef: catListRef, getItemStyle: getCatStyle,
    onPointerDown: onCatPointerDown, onPointerMove: onCatPointerMove, onPointerUp: onCatPointerUp,
  } = useDragReorder(categoryItems, handleCatReorder, true);

  // Summary
  const totalAssets = assets.filter(a => a.tracking !== 'daily');
  const improvingCount = totalAssets.filter(a => {
    const delta = a.value - a.previous_value;
    return a.direction === 'up_good' ? delta > 0 : delta < 0;
  }).length;
  const decliningCount = totalAssets.filter(a => {
    const delta = a.value - a.previous_value;
    return a.direction === 'up_good' ? delta < 0 : delta > 0;
  }).length;

  const startEditCatNote = (cat: string) => {
    setEditingCatNote(cat);
    setCatNoteDraft(catNotes[cat] || '');
  };
  const cancelEditCatNote = () => { setEditingCatNote(null); setCatNoteDraft(''); };
  const saveCatNote = async (cat: string) => {
    const note = catNoteDraft;
    setCatNotes(prev => ({ ...prev, [cat]: note }));
    setEditingCatNote(null);
    try {
      await fetch('/api/asset-category-notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, notes: note }),
      });
      toast.success('Note saved');
    } catch { toast.error('Failed to save note'); }
  };
  const clearCatNote = async (cat: string) => {
    setCatNotes(prev => ({ ...prev, [cat]: '' }));
    try {
      await fetch('/api/asset-category-notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, notes: '' }),
      });
      toast.success('Note cleared');
    } catch { toast.error('Failed to clear note'); }
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  };

  const handleSnapshot = async () => {
    setSnapshotting(true);
    try {
      const res = await fetch('/api/assets', { method: 'PATCH' });
      if (res.ok) { toast.success('Snapshot saved'); await fetchAssets(); }
      else toast.error('Failed');
    } finally { setSnapshotting(false); }
  };

  const handleUpdateValue = async (id: string, newValue: number) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, value: newValue } : a));
    try {
      await fetch(`/api/assets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: newValue }) });
    } catch { toast.error('Failed to update'); await fetchAssets(); }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, notes } : a));
    fetch(`/api/assets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes }) }).catch(() => fetchAssets());
  };

  const handleDelete = async (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    toast.success('Metric deleted');
  };

  // Daily log upsert
  const handleDailyLogUpdate = async (assetId: string, date: string, value: number) => {
    // Optimistic
    setDailyLogs(prev => {
      const exists = prev.find(l => l.asset_id === assetId && l.date.startsWith(date));
      if (exists) return prev.map(l => l.asset_id === assetId && l.date.startsWith(date) ? { ...l, value } : l);
      return [...prev, { id: `temp-${Date.now()}`, asset_id: assetId, date, value, created_at: '' }];
    });
    try {
      await fetch('/api/asset-daily-logs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: assetId, date, value }),
      });
    } catch { toast.error('Failed to save daily entry'); }
  };

  const resetForm = () => {
    setFormCategory(''); setFormCategoryCustom(false); setFormMetric(''); setFormValue('0');
    setFormDirection('up_good'); setFormTracking('total'); setFormNotes(''); setFormDepartmentId(''); setFormSortOrder('0');
    setEditingId(null);
  };

  const openEdit = (a: Asset) => {
    setEditingId(a.id); setFormCategory(a.category); setFormCategoryCustom(false); setFormMetric(a.metric);
    setFormValue(String(a.value)); setFormDirection(a.direction);
    setFormTracking(a.tracking || 'total');
    setFormNotes(a.notes); setFormDepartmentId(a.department_id || ''); setFormSortOrder(String(a.sort_order));
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formCategory.trim()) { toast.error('Category is required'); return; }
    if (!formMetric.trim()) { toast.error('Metric name is required'); return; }
    setSubmitting(true);
    const body = {
      category: formCategory, metric: formMetric.trim(),
      value: Number(formValue) || 0, direction: formDirection,
      tracking: formTracking,
      notes: formNotes, department_id: formDepartmentId || null, sort_order: Number(formSortOrder) || 0,
    };
    try {
      if (editingId) {
        const res = await fetch(`/api/assets/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('Failed');
        toast.success('Metric updated');
      } else {
        const res = await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, previous_value: Number(formValue) || 0 }) });
        if (!res.ok) throw new Error('Failed');
        toast.success('Metric added');
      }
      resetForm(); setShowForm(false); await fetchAssets();
    } catch { toast.error('Something went wrong'); } finally { setSubmitting(false); }
  };

  if (loading) {
    return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Business Assets</h2>
          <p className="text-sm text-gray-400 mt-0.5">Daily operational metrics — track what matters</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSnapshot} disabled={snapshotting} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-all disabled:opacity-50" title="Save today's totals as 'previous'">
            <RefreshCw size={13} className={snapshotting ? 'animate-spin' : ''} />
            End of Day Snapshot
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm">
            <Plus size={14} />
            Add Metric
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Metrics</p>
          <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
          <p className="text-xs text-gray-400 mt-1">{grouped.length} categories</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Improving</p>
          <p className="text-2xl font-bold text-emerald-600">{improvingCount}</p>
          <p className="text-xs text-emerald-500 mt-1">totals trending right</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Needs Attention</p>
          <p className="text-2xl font-bold text-rose-600">{decliningCount}</p>
          <p className="text-xs text-rose-500 mt-1">totals trending wrong</p>
        </div>
      </div>

      {/* Grouped Sections */}
      {assets.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <BarChart3 size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-400 mb-1">No metrics yet</p>
          <p className="text-xs text-gray-300">Add metrics or run the seed SQL to get started</p>
        </div>
      ) : (
        <div
          ref={catListRef}
          className="space-y-4"
          style={{ userSelect: dragCatId ? 'none' : undefined }}
          onPointerMove={dragCatId ? onCatPointerMove : undefined}
          onPointerUp={dragCatId ? onCatPointerUp : undefined}
          onPointerLeave={dragCatId ? onCatPointerUp : undefined}
        >
          {grouped.map(([category, { totals, dailies }], catIdx) => {
            const color = catColor(category);
            const collapsed = collapsedCats.has(category);
            const allItems = [...totals, ...dailies];

            return (
              <div key={category} data-drag-item className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm" style={getCatStyle(catIdx, category)}>
                {/* Category Header */}
                <div className="flex items-center">
                  {/* Grip handle */}
                  <div
                    className="pl-2 py-3.5 shrink-0 touch-none cursor-grab active:cursor-grabbing flex items-center opacity-30 hover:opacity-100 transition-opacity"
                    onPointerDown={e => onCatPointerDown(e, category)}
                  >
                    <GripVertical size={14} className="text-gray-400" />
                  </div>
                  <button onClick={() => toggleCategory(category)} className="flex-1 flex items-center gap-3 px-3 py-3.5 hover:bg-gray-50 transition-colors text-left">
                    <div className={`w-2 h-8 rounded-full ${color}`} />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">{category}</h3>
                    <p className="text-xs text-gray-400">{allItems.length} metric{allItems.length !== 1 ? 's' : ''}</p>
                  </div>
                    {collapsed ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </button>
                </div>

                {/* Category Note */}
                {!collapsed && (
                  <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                    {editingCatNote === category ? (
                      <div className="flex items-start gap-2">
                        <textarea
                          value={catNoteDraft}
                          onChange={e => setCatNoteDraft(e.target.value)}
                          placeholder="Add a note for this category..."
                          rows={2}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none resize-none"
                          autoFocus
                        />
                        <button onClick={() => saveCatNote(category)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Save">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelEditCatNote} className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors" title="Cancel">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 min-h-[28px]">
                        <p className="flex-1 text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">
                          {catNotes[category] || <span className="text-gray-300 italic">No note — click edit to add</span>}
                        </p>
                        <button onClick={() => startEditCatNote(category)} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 shrink-0 transition-colors" title="Edit note">
                          <Pencil size={12} />
                        </button>
                        {catNotes[category] && (
                          <button onClick={() => clearCatNote(category)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 shrink-0 transition-colors" title="Clear note">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!collapsed && (
                  <div className="border-t border-gray-100">
                    {/* ── TOTAL metrics table ── */}
                    {totals.length > 0 && (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50/60">
                            <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">Metric</th>
                            <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 w-28">Value</th>
                            <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 w-28">Previous</th>
                            <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 w-24">Change</th>
                            <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5">Notes</th>
                            <th className="w-16"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {totals.map((asset, idx) => {
                            const delta = asset.value - asset.previous_value;
                            const isGood = asset.direction === 'up_good' ? delta > 0 : delta < 0;
                            const isBad = asset.direction === 'up_good' ? delta < 0 : delta > 0;
                            return (
                              <tr key={asset.id} className={`border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">{asset.metric}</span>
                                    {asset.department_id && deptMap[asset.department_id] && (
                                      <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-semibold">{deptMap[asset.department_id]}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <input type="number" defaultValue={asset.value} key={`v-${asset.id}-${asset.value}`}
                                    onBlur={e => { const v = Number(e.target.value); if (!isNaN(v) && v !== asset.value) handleUpdateValue(asset.id, v); }}
                                    onKeyDown={e => { if (e.key === 'Enter') { const v = Number((e.target as HTMLInputElement).value); if (!isNaN(v)) handleUpdateValue(asset.id, v); (e.target as HTMLInputElement).blur(); } }}
                                    className="w-24 text-right px-2 py-1 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#3b82f6] outline-none tabular-nums"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right text-sm text-gray-400 tabular-nums">{asset.previous_value.toLocaleString()}</td>
                                <td className="px-4 py-3 text-center">
                                  {delta === 0
                                    ? <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Minus size={12} /> 0</span>
                                    : <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isGood ? 'text-emerald-600' : isBad ? 'text-rose-600' : 'text-gray-500'}`}>
                                        {delta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {delta > 0 ? '+' : ''}{delta.toLocaleString()}
                                      </span>
                                  }
                                </td>
                                <td className="px-4 py-3">
                                  <input type="text" defaultValue={asset.notes} key={`n-${asset.id}`}
                                    onBlur={e => { if (e.target.value !== asset.notes) handleUpdateNotes(asset.id, e.target.value); }}
                                    placeholder="—" className="w-full px-2 py-1 text-xs text-gray-500 border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none" />
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => openEdit(asset)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil size={12} /></button>
                                    <button onClick={() => handleDelete(asset.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {/* ── DAILY metrics rows ── */}
                    {dailies.length > 0 && (
                      <div className={totals.length > 0 ? 'border-t border-gray-200' : ''}>
                        <div className="px-5 py-2.5 bg-blue-50/50 border-b border-blue-100">
                          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Daily Tracking</p>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/60">
                              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-2.5">Metric</th>
                              <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 w-28">Today</th>
                              <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5 w-28">30-Day Total</th>
                              <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-2.5">Notes</th>
                              <th className="w-28"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {dailies.map((asset, idx) => {
                              const assetLogs = logMap[asset.id] || {};
                              const todayStr = format(new Date(), 'yyyy-MM-dd');
                              const todayVal = assetLogs[todayStr] ?? '';
                              const total30 = last30.reduce((s, d) => s + (assetLogs[d] || 0), 0);

                              return (
                                <tr key={asset.id} className={`border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                                  <td className="px-5 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-700">{asset.metric}</span>
                                      {asset.direction === 'down_good' && (
                                        <span className="text-[9px] px-1 py-0.5 bg-amber-50 text-amber-600 rounded font-semibold">lower=better</span>
                                      )}
                                      {asset.department_id && deptMap[asset.department_id] && (
                                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-semibold">{deptMap[asset.department_id]}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <input type="number" defaultValue={todayVal} key={`td-${asset.id}-${todayVal}`}
                                      onBlur={e => { const v = Number(e.target.value); if (e.target.value !== '' && !isNaN(v) && v !== (todayVal || -1)) handleDailyLogUpdate(asset.id, todayStr, v); }}
                                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                      placeholder="0"
                                      className="w-20 text-right px-2 py-1 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#3b82f6] outline-none tabular-nums"
                                    />
                                  </td>
                                  <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 tabular-nums">{total30.toLocaleString()}</td>
                                  <td className="px-4 py-3">
                                    <input type="text" defaultValue={asset.notes} key={`n-${asset.id}`}
                                      onBlur={e => { if (e.target.value !== asset.notes) handleUpdateNotes(asset.id, e.target.value); }}
                                      placeholder="—" className="w-full px-2 py-1 text-xs text-gray-500 border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none" />
                                  </td>
                                  <td className="px-3 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                      <button onClick={() => { setCalendarAssetId(asset.id); setCalendarMonth(new Date()); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors" title="View calendar">
                                        <Calendar size={14} />
                                      </button>
                                      <button onClick={() => openEdit(asset)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil size={12} /></button>
                                      <button onClick={() => handleDelete(asset.id)} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowForm(false); resetForm(); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{editingId ? 'Edit Metric' : 'Add Metric'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className={labelCls}>Category *</label>
                {formCategoryCustom ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formCategory}
                      onChange={e => setFormCategory(e.target.value)}
                      placeholder="Type new category name..."
                      className={inputCls}
                      autoFocus
                    />
                    <button onClick={() => setFormCategoryCustom(false)} className="px-2 text-xs text-gray-400 hover:text-gray-600 shrink-0">Cancel</button>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={e => {
                        if (e.target.value === '__new__') {
                          setFormCategory('');
                          setFormCategoryCustom(true);
                        } else {
                          setFormCategory(e.target.value);
                        }
                      }}
                      className={selectCls}
                    >
                      <option value="">Select a category...</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="__new__">+ Create new category...</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>
              <div>
                <label className={labelCls}>Metric Name *</label>
                <input type="text" value={formMetric} onChange={e => setFormMetric(e.target.value)} placeholder="e.g. Sites ready to sell" className={inputCls} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Tracking Type</label>
                  <div className="relative">
                    <select value={formTracking} onChange={e => setFormTracking(e.target.value as any)} className={selectCls}>
                      <option value="total">Total (overall number)</option>
                      <option value="daily">Daily (30-day log)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Direction</label>
                  <div className="relative">
                    <select value={formDirection} onChange={e => setFormDirection(e.target.value as any)} className={selectCls}>
                      <option value="up_good">Higher = Good</option>
                      <option value="down_good">Lower = Good</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              {formTracking === 'total' && (
                <div>
                  <label className={labelCls}>Current Value</label>
                  <input type="number" value={formValue} onChange={e => setFormValue(e.target.value)} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Notes</label>
                <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Optional context" className={inputCls} />
              </div>
              {departments.length > 0 && (
                <div>
                  <label className={labelCls}>Department <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                  <div className="relative">
                    <select value={formDepartmentId} onChange={e => setFormDepartmentId(e.target.value)} className={selectCls}>
                      <option value="">None (Global)</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] shadow-sm disabled:opacity-50">
                {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Add Metric'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {calendarAssetId && (() => {
        const asset = assets.find(a => a.id === calendarAssetId);
        if (!asset) return null;
        const assetLogs = logMap[calendarAssetId] || {};

        // Build calendar grid for the selected month
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weeks: (number | null)[][] = [];
        let week: (number | null)[] = Array(firstDay).fill(null);
        for (let d = 1; d <= daysInMonth; d++) {
          week.push(d);
          if (week.length === 7) { weeks.push(week); week = []; }
        }
        if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

        const monthTotal = Array.from({ length: daysInMonth }, (_, i) => {
          const dateStr = format(new Date(year, month, i + 1), 'yyyy-MM-dd');
          return assetLogs[dateStr] || 0;
        }).reduce((a, b) => a + b, 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCalendarAssetId(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">{asset.metric}</h2>
                  <button onClick={() => setCalendarAssetId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Click any day to enter a value</p>
              </div>

              {/* Month navigation */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-gray-50">
                <button onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-gray-900">{format(calendarMonth, 'MMMM yyyy')}</span>
                <button onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="px-6 py-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase">{d}</div>
                  ))}
                </div>
                {/* Weeks */}
                {weeks.map((wk, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                    {wk.map((day, di) => {
                      if (!day) return <div key={di} />;
                      const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
                      const val = assetLogs[dateStr];
                      const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                      const hasValue = val != null && val > 0;

                      return (
                        <div key={di} className={`relative rounded-lg p-1 min-h-[52px] flex flex-col items-center border transition-colors ${
                          isToday ? 'border-blue-300 bg-blue-50' : hasValue ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200'
                        }`}>
                          <span className={`text-[10px] font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>{day}</span>
                          <input
                            type="number"
                            defaultValue={val ?? ''}
                            key={`cal-${calendarAssetId}-${dateStr}-${val}`}
                            onBlur={e => {
                              const v = Number(e.target.value);
                              if (e.target.value !== '' && !isNaN(v) && v !== (val ?? -1)) handleDailyLogUpdate(calendarAssetId, dateStr, v);
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                            placeholder="·"
                            className={`w-full text-center text-xs font-bold tabular-nums bg-transparent outline-none mt-0.5 ${
                              hasValue ? 'text-gray-900' : 'text-gray-300'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Month total */}
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Month Total</span>
                <span className="text-sm font-bold text-gray-900 tabular-nums">{monthTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
