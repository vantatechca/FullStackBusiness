'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
  ArrowUpRight, ArrowDownRight, Minus, Plus, X, ChevronDown, ChevronRight,
  Pencil, Trash2, RefreshCw, BarChart3,
} from 'lucide-react';
import type { Asset } from '@/lib/types';

// Category display config
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  'Sites':       { label: 'Sites',             color: 'bg-blue-500' },
  'Payments':    { label: 'Payments',          color: 'bg-violet-500' },
  'Orders':      { label: 'Orders',            color: 'bg-emerald-500' },
  'Gmail':       { label: 'Gmail',             color: 'bg-rose-500' },
  'GMB':         { label: 'Google My Business', color: 'bg-amber-500' },
  'Blogs':       { label: 'Blogs',             color: 'bg-teal-500' },
  'Chat':        { label: 'Chat / Support',    color: 'bg-orange-500' },
  'GMC':         { label: 'Google Merchant Center', color: 'bg-sky-500' },
  'Google Ads':  { label: 'Google Ads',        color: 'bg-pink-500' },
};

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all";
const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";
const selectCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white";

export default function AssetsView() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [snapshotting, setSnapshotting] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState('Sites');
  const [formMetric, setFormMetric] = useState('');
  const [formValue, setFormValue] = useState('0');
  const [formDirection, setFormDirection] = useState<'up_good' | 'down_good'>('up_good');
  const [formNotes, setFormNotes] = useState('');
  const [formSortOrder, setFormSortOrder] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  // Group by category
  const grouped = useMemo(() => {
    const map: Record<string, Asset[]> = {};
    assets.forEach(a => {
      const cat = a.category || 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(a);
    });
    // Sort categories by the order they appear in CATEGORY_CONFIG, then alphabetically
    const configOrder = Object.keys(CATEGORY_CONFIG);
    return Object.entries(map).sort(([a], [b]) => {
      const ai = configOrder.indexOf(a);
      const bi = configOrder.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [assets]);

  // Summary stats
  const totalMetrics = assets.length;
  const improvingCount = assets.filter(a => {
    const delta = a.value - a.previous_value;
    return a.direction === 'up_good' ? delta > 0 : delta < 0;
  }).length;
  const decliningCount = assets.filter(a => {
    const delta = a.value - a.previous_value;
    return a.direction === 'up_good' ? delta < 0 : delta > 0;
  }).length;

  const toggleCategory = (cat: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const handleSnapshot = async () => {
    setSnapshotting(true);
    try {
      const res = await fetch('/api/assets', { method: 'PATCH' });
      if (res.ok) {
        toast.success('Daily snapshot saved — previous values updated');
        await fetchAssets();
      } else {
        toast.error('Failed to save snapshot');
      }
    } finally {
      setSnapshotting(false);
    }
  };

  const handleUpdateValue = async (id: string, newValue: number) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, value: newValue } : a));
    try {
      await fetch(`/api/assets/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue }),
      });
    } catch {
      toast.error('Failed to update');
      await fetchAssets();
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, notes } : a));
    fetch(`/api/assets/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }).catch(() => fetchAssets());
  };

  const handleDelete = async (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    toast.success('Metric deleted');
  };

  const resetForm = () => {
    setFormCategory('Sites'); setFormMetric(''); setFormValue('0');
    setFormDirection('up_good'); setFormNotes(''); setFormSortOrder('0');
    setEditingId(null);
  };

  const openEdit = (a: Asset) => {
    setEditingId(a.id); setFormCategory(a.category); setFormMetric(a.metric);
    setFormValue(String(a.value)); setFormDirection(a.direction);
    setFormNotes(a.notes); setFormSortOrder(String(a.sort_order));
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formMetric.trim()) { toast.error('Metric name is required'); return; }
    setSubmitting(true);
    const body = {
      category: formCategory, metric: formMetric.trim(),
      value: Number(formValue) || 0, direction: formDirection,
      notes: formNotes, sort_order: Number(formSortOrder) || 0,
    };
    try {
      if (editingId) {
        const res = await fetch(`/api/assets/${editingId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed');
        toast.success('Metric updated');
      } else {
        const res = await fetch('/api/assets', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, previous_value: Number(formValue) || 0 }),
        });
        if (!res.ok) throw new Error('Failed');
        toast.success('Metric added');
      }
      resetForm(); setShowForm(false); await fetchAssets();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
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
          <button
            onClick={handleSnapshot}
            disabled={snapshotting}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-all disabled:opacity-50"
            title="Save today's values as 'previous' for tomorrow's comparison"
          >
            <RefreshCw size={13} className={snapshotting ? 'animate-spin' : ''} />
            End of Day Snapshot
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm"
          >
            <Plus size={14} />
            Add Metric
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Total Metrics</p>
          <p className="text-2xl font-bold text-gray-900">{totalMetrics}</p>
          <p className="text-xs text-gray-400 mt-1">{grouped.length} categories</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Improving</p>
          <p className="text-2xl font-bold text-emerald-600">{improvingCount}</p>
          <p className="text-xs text-emerald-500 mt-1">metrics trending in the right direction</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Needs Attention</p>
          <p className="text-2xl font-bold text-rose-600">{decliningCount}</p>
          <p className="text-xs text-rose-500 mt-1">metrics trending wrong</p>
        </div>
      </div>

      {/* Grouped Metrics Table */}
      {assets.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <BarChart3 size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-400 mb-1">No metrics yet</p>
          <p className="text-xs text-gray-300">Add metrics or run the seed SQL to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped.map(([category, items]) => {
            const catCfg = CATEGORY_CONFIG[category] || { label: category, color: 'bg-gray-500' };
            const collapsed = collapsedCats.has(category);

            return (
              <div key={category} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className={`w-2 h-8 rounded-full ${catCfg.color}`} />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{catCfg.label}</h3>
                    <p className="text-xs text-gray-400">{items.length} metric{items.length !== 1 ? 's' : ''}</p>
                  </div>
                  {collapsed ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>

                {/* Metrics Table */}
                {!collapsed && (
                  <div className="border-t border-gray-100">
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
                        {items.map((asset, idx) => {
                          const delta = asset.value - asset.previous_value;
                          const isGood = asset.direction === 'up_good' ? delta > 0 : delta < 0;
                          const isBad = asset.direction === 'up_good' ? delta < 0 : delta > 0;

                          return (
                            <tr key={asset.id} className={`border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                              <td className="px-5 py-3 text-sm font-medium text-gray-700">{asset.metric}</td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  defaultValue={asset.value}
                                  key={`val-${asset.id}-${asset.value}`}
                                  onBlur={e => {
                                    const v = Number(e.target.value);
                                    if (!isNaN(v) && v !== asset.value) handleUpdateValue(asset.id, v);
                                  }}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      const v = Number((e.target as HTMLInputElement).value);
                                      if (!isNaN(v)) handleUpdateValue(asset.id, v);
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  className="w-24 text-right px-2 py-1 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#3b82f6] outline-none tabular-nums"
                                />
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-gray-400 tabular-nums">{asset.previous_value.toLocaleString()}</td>
                              <td className="px-4 py-3 text-center">
                                {delta === 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                    <Minus size={12} /> 0
                                  </span>
                                ) : (
                                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                                    isGood ? 'text-emerald-600' : isBad ? 'text-rose-600' : 'text-gray-500'
                                  }`}>
                                    {delta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {delta > 0 ? '+' : ''}{delta.toLocaleString()}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  defaultValue={asset.notes}
                                  key={`notes-${asset.id}`}
                                  onBlur={e => {
                                    if (e.target.value !== asset.notes) handleUpdateNotes(asset.id, e.target.value);
                                  }}
                                  placeholder="—"
                                  className="w-full px-2 py-1 text-xs text-gray-500 border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none"
                                />
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
                <label className={labelCls}>Category</label>
                <div className="relative">
                  <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className={selectCls}>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Metric Name *</label>
                <input type="text" value={formMetric} onChange={e => setFormMetric(e.target.value)} placeholder="e.g. Sites ready to sell" className={inputCls} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Current Value</label>
                  <input type="number" value={formValue} onChange={e => setFormValue(e.target.value)} className={inputCls} />
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
              <div>
                <label className={labelCls}>Notes</label>
                <input type="text" value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Optional context" className={inputCls} />
              </div>
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
    </div>
  );
}
