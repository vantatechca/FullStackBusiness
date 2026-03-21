'use client';

import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { DEPARTMENT_ICONS } from '@/lib/departments';

interface AddDepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ICON_OPTIONS = Object.keys(DEPARTMENT_ICONS);

const TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'overview', label: 'Overview' },
  { value: 'gmb', label: 'GMB' },
  { value: 'influencers', label: 'Influencers' },
  { value: 'restock', label: 'Restock' },
  { value: 'team', label: 'Team' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'expenses-global', label: 'Expenses Global' },
  { value: 'net-profit', label: 'Net Profit' },
];

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function AddDepartmentModal({ open, onClose, onSuccess }: AddDepartmentModalProps) {
  const [form, setForm] = useState({
    name: '',
    icon: 'BarChart3',
    type: 'standard',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [iconSearch, setIconSearch] = useState('');

  if (!open) return null;

  const filteredIcons = ICON_OPTIONS.filter(i =>
    i.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Department name is required.');
      return;
    }

    const id = slugify(form.name);
    if (!id) {
      setError('Could not generate a valid ID from that name.');
      return;
    }

    setLoading(true);
    try {
      // Get max sort_order first
      const deptsRes = await fetch('/api/departments');
      const depts = await deptsRes.json();
      const maxOrder = depts.length > 0
        ? Math.max(...depts.map((d: any) => d.sort_order))
        : 0;

      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: form.name.trim(),
          icon: form.icon,
          type: form.type,
          sort_order: maxOrder + 1,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 409 || data?.error?.includes('duplicate')) {
          setError(`A department with ID "${id}" already exists.`);
        } else {
          setError(data?.error || 'Failed to create department.');
        }
        return;
      }

      setForm({ name: '', icon: 'BarChart3', type: 'standard' });
      setIconSearch('');
      onSuccess();
      onClose();
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Plus size={15} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900">Add Department</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Email Marketing"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              autoFocus
            />
            {form.name && (
              <p className="mt-1 text-[11px] text-gray-400">
                ID: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">{slugify(form.name)}</code>
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-shadow"
            >
              {TYPE_OPTIONS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Icon — <span className="text-blue-600 font-semibold">{form.icon}</span>
            </label>
            <input
              type="text"
              placeholder="Search icons..."
              value={iconSearch}
              onChange={e => setIconSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-2 transition-shadow"
            />
            <div className="grid grid-cols-8 gap-1 max-h-36 overflow-y-auto p-1 border border-gray-100 rounded-lg bg-gray-50">
              {filteredIcons.map(iconName => {
                const Icon = DEPARTMENT_ICONS[iconName];
                const selected = form.icon === iconName;
                return (
                  <button
                    key={iconName}
                    onClick={() => setForm(f => ({ ...f, icon: iconName }))}
                    title={iconName}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                      selected
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {Icon && <Icon size={16} />}
                  </button>
                );
              })}
              {filteredIcons.length === 0 && (
                <div className="col-span-8 py-3 text-center text-xs text-gray-400">
                  No icons match "{iconSearch}"
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? (
              <><Loader2 size={14} className="animate-spin" /> Creating…</>
            ) : (
              <><Plus size={14} /> Add Department</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}