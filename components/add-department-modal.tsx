// 'use client';

// import { useState } from 'react';
// import { X, Plus, Loader2 } from 'lucide-react';
// import { DEPARTMENT_ICONS } from '@/lib/departments';

// interface AddDepartmentModalProps {
//   open: boolean;
//   onClose: () => void;
//   onSuccess: () => void;
// }

// const ICON_OPTIONS = Object.keys(DEPARTMENT_ICONS);

// const TYPE_OPTIONS = [
//   { value: 'standard', label: 'Standard' },
//   { value: 'overview', label: 'Overview' },
//   { value: 'gmb', label: 'GMB' },
//   { value: 'influencers', label: 'Influencers' },
//   { value: 'restock', label: 'Restock' },
//   { value: 'team', label: 'Team' },
//   { value: 'tasks', label: 'Tasks' },
//   { value: 'expenses-global', label: 'Expenses Global' },
//   { value: 'net-profit', label: 'Net Profit' },
// ];

// function slugify(str: string) {
//   return str
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9\s-]/g, '')
//     .replace(/\s+/g, '-')
//     .replace(/-+/g, '-');
// }

// export default function AddDepartmentModal({ open, onClose, onSuccess }: AddDepartmentModalProps) {
//   const [form, setForm] = useState({
//     name: '',
//     icon: 'BarChart3',
//     type: 'standard',
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [iconSearch, setIconSearch] = useState('');

//   if (!open) return null;

//   const filteredIcons = ICON_OPTIONS.filter(i =>
//     i.toLowerCase().includes(iconSearch.toLowerCase())
//   );

//   const handleSubmit = async () => {
//     setError('');
//     if (!form.name.trim()) {
//       setError('Department name is required.');
//       return;
//     }

//     const id = slugify(form.name);
//     if (!id) {
//       setError('Could not generate a valid ID from that name.');
//       return;
//     }

//     setLoading(true);
//     try {
//       // Get max sort_order first
//       const deptsRes = await fetch('/api/departments');
//       const depts = await deptsRes.json();
//       const maxOrder = depts.length > 0
//         ? Math.max(...depts.map((d: any) => d.sort_order))
//         : 0;

//       const res = await fetch('/api/departments', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           id,
//           name: form.name.trim(),
//           icon: form.icon,
//           type: form.type,
//           sort_order: maxOrder + 1,
//         }),
//       });

//       if (!res.ok) {
//         const data = await res.json();
//         if (res.status === 409 || data?.error?.includes('duplicate')) {
//           setError(`A department with ID "${id}" already exists.`);
//         } else {
//           setError(data?.error || 'Failed to create department.');
//         }
//         return;
//       }

//       setForm({ name: '', icon: 'BarChart3', type: 'standard' });
//       setIconSearch('');
//       onSuccess();
//       onClose();
//     } catch (err) {
//       setError('Something went wrong. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       {/* Backdrop */}
//       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

//       {/* Modal */}
//       <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
//         {/* Header */}
//         <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
//           <div className="flex items-center gap-2">
//             <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
//               <Plus size={15} className="text-blue-600" />
//             </div>
//             <h2 className="text-sm font-semibold text-gray-900">Add Department</h2>
//           </div>
//           <button
//             onClick={onClose}
//             className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
//           >
//             <X size={15} />
//           </button>
//         </div>

//         {/* Body */}
//         <div className="px-5 py-4 space-y-4">
//           {/* Name */}
//           <div>
//             <label className="block text-xs font-medium text-gray-700 mb-1.5">
//               Department Name <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               placeholder="e.g. Email Marketing"
//               value={form.name}
//               onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
//               className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
//               autoFocus
//             />
//             {form.name && (
//               <p className="mt-1 text-[11px] text-gray-400">
//                 ID: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">{slugify(form.name)}</code>
//               </p>
//             )}
//           </div>

//           {/* Type */}
//           <div>
//             <label className="block text-xs font-medium text-gray-700 mb-1.5">Type</label>
//             <select
//               value={form.type}
//               onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
//               className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-shadow"
//             >
//               {TYPE_OPTIONS.map(t => (
//                 <option key={t.value} value={t.value}>{t.label}</option>
//               ))}
//             </select>
//           </div>

//           {/* Icon Picker */}
//           <div>
//             <label className="block text-xs font-medium text-gray-700 mb-1.5">
//               Icon — <span className="text-blue-600 font-semibold">{form.icon}</span>
//             </label>
//             <input
//               type="text"
//               placeholder="Search icons..."
//               value={iconSearch}
//               onChange={e => setIconSearch(e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-2 transition-shadow"
//             />
//             <div className="grid grid-cols-8 gap-1 max-h-36 overflow-y-auto p-1 border border-gray-100 rounded-lg bg-gray-50">
//               {filteredIcons.map(iconName => {
//                 const Icon = DEPARTMENT_ICONS[iconName];
//                 const selected = form.icon === iconName;
//                 return (
//                   <button
//                     key={iconName}
//                     onClick={() => setForm(f => ({ ...f, icon: iconName }))}
//                     title={iconName}
//                     className={`p-2 rounded-lg flex items-center justify-center transition-all ${
//                       selected
//                         ? 'bg-blue-500 text-white shadow-sm'
//                         : 'hover:bg-white hover:shadow-sm text-gray-500 hover:text-gray-700'
//                     }`}
//                   >
//                     {Icon && <Icon size={16} />}
//                   </button>
//                 );
//               })}
//               {filteredIcons.length === 0 && (
//                 <div className="col-span-8 py-3 text-center text-xs text-gray-400">
//                   No icons match "{iconSearch}"
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Error */}
//           {error && (
//             <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
//               {error}
//             </p>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             disabled={loading || !form.name.trim()}
//             className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
//           >
//             {loading ? (
//               <><Loader2 size={14} className="animate-spin" /> Creating…</>
//             ) : (
//               <><Plus size={14} /> Add Department</>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


'use client';

import { useState } from 'react';
import { X, Plus, Loader2, Building2, Hash, Layout } from 'lucide-react';
import { toast } from 'sonner';
import { DEPARTMENT_ICONS } from '@/lib/departments';

interface AddDepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ICON_OPTIONS = Object.keys(DEPARTMENT_ICONS);

const TYPE_OPTIONS = [
  { value: 'standard',       label: 'Standard'        },
  { value: 'overview',       label: 'Overview'        },
  { value: 'gmb',            label: 'GMB'             },
  { value: 'influencers',    label: 'Influencers'     },
  { value: 'restock',        label: 'Restock'         },
  { value: 'team',           label: 'Team'            },
  { value: 'tasks',          label: 'Tasks'           },
  { value: 'expenses-global',label: 'Expenses Global' },
  { value: 'net-profit',     label: 'Net Profit'      },
];

// Tile colors for icon picker selected state
const TILE_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-sky-500', 'bg-teal-500', 'bg-orange-500',
];

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
      {children}
      {required && <span className="text-red-400 normal-case tracking-normal font-normal">*</span>}
    </label>
  );
}

export default function AddDepartmentModal({ open, onClose, onSuccess }: AddDepartmentModalProps) {
  const [form, setForm] = useState({ name: '', icon: 'BarChart3', type: 'standard' });
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [iconSearch, setIconSearch] = useState('');

  if (!open) return null;

  const filteredIcons = ICON_OPTIONS.filter(i =>
    i.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const SelectedIcon = DEPARTMENT_ICONS[form.icon];

  const handleSubmit = async () => {
    setError('');
    if (!form.name.trim()) { setError('Department name is required.'); return; }
    const id = slugify(form.name);
    if (!id) { setError('Could not generate a valid ID from that name.'); return; }

    setLoading(true);
    try {
      const deptsRes = await fetch('/api/departments');
      const depts = await deptsRes.json();
      const maxOrder = depts.length > 0 ? Math.max(...depts.map((d: { sort_order: number }) => d.sort_order)) : 0;

      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id, name: form.name.trim(), icon: form.icon, type: form.type, sort_order: maxOrder + 1,
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
      toast.success('Department created');
      onSuccess();
      onClose();
    } catch {
      setError('Something went wrong. Please try again.');
      toast.error('Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              {SelectedIcon
                ? <SelectedIcon size={17} className="text-blue-600" />
                : <Building2 size={17} className="text-blue-600" />
              }
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Add Department</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {form.name.trim() ? `"${form.name.trim()}"` : 'Fill in the details below'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Name */}
          <div>
            <FieldLabel required><Building2 size={10} className="opacity-60" />Name</FieldLabel>
            <input
              type="text"
              placeholder="e.g. Email Marketing"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder-gray-300"
              autoFocus
            />
            {form.name.trim() && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <Hash size={10} className="text-gray-400 shrink-0" />
                <code className="text-[11px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                  {slugify(form.name)}
                </code>
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <FieldLabel><Layout size={10} className="opacity-60" />Type</FieldLabel>
            <div className="grid grid-cols-3 gap-1.5">
              {TYPE_OPTIONS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, type: t.value }))}
                  className={`px-2.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                    form.type === t.value
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel>Icon</FieldLabel>
              <span className="text-[11px] font-semibold text-blue-600">{form.icon}</span>
            </div>
            <input
              type="text"
              placeholder="Search icons…"
              value={iconSearch}
              onChange={e => setIconSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none mb-2 transition-all placeholder-gray-300"
            />
            <div className="grid grid-cols-9 gap-1 max-h-36 overflow-y-auto p-1.5 border border-gray-100 rounded-xl bg-gray-50/80">
              {filteredIcons.map((iconName, i) => {
                const Icon = DEPARTMENT_ICONS[iconName];
                const selected = form.icon === iconName;
                const tileColor = TILE_COLORS[i % TILE_COLORS.length];
                return (
                  <button
                    key={iconName}
                    onClick={() => setForm(f => ({ ...f, icon: iconName }))}
                    title={iconName}
                    className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                      selected
                        ? `${tileColor} text-white shadow-sm scale-105`
                        : 'hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {Icon && <Icon size={15} />}
                  </button>
                );
              })}
              {filteredIcons.length === 0 && (
                <div className="col-span-9 py-4 text-center text-xs text-gray-400">
                  No icons match &quot;{iconSearch}&quot;
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
              <span className="shrink-0 mt-0.5">⚠️</span>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60">
          <p className="text-[11px] text-gray-400">
            {form.name.trim()
              ? <>ID will be <code className="bg-gray-200 px-1 py-0.5 rounded text-gray-600">{slugify(form.name)}</code></>
              : 'Enter a name to preview the ID'
            }
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-[#3b82f6] text-white rounded-xl hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading
                ? <><Loader2 size={13} className="animate-spin" /> Creating…</>
                : <><Plus size={13} /> Add Department</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}