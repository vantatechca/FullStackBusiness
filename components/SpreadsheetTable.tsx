'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import type { ColumnDef } from '@/lib/types';

// ── Avatar helpers ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ── Multi-select cell ─────────────────────────────────────────────────────────
const MultiSelectCell = memo(function MultiSelectCell({
  value,
  options,
  onCommit,
}: {
  value: string[];
  options: string[];
  onCommit: (val: string[]) => void;
}) {
  const [local, setLocal] = useState<string[]>(value ?? []);
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);

  // Sync from parent only when not open (avoids clobbering in-flight changes)
  useEffect(() => {
    if (!open) setLocal(value ?? []);
  }, [value, open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function toggle(name: string) {
    const next = local.includes(name)
      ? local.filter(n => n !== name)
      : [...local, name];
    setLocal(next);
    onCommit(next);
  }

  function remove(name: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = local.filter(n => n !== name);
    setLocal(next);
    onCommit(next);
  }

  const unknown = local.filter(n => !options.includes(n));

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        className={`min-h-[30px] w-full px-2 py-1 rounded border text-xs cursor-pointer flex items-start gap-1 flex-wrap transition-colors ${
          open ? 'border-blue-400 ring-1 ring-blue-200 bg-white' : 'border-transparent hover:border-gray-200 bg-transparent'
        }`}
      >
        {local.length === 0 ? (
          <span className="text-gray-400 text-[11px] self-center flex-1 select-none">—</span>
        ) : (
          local.map(name => (
            <span
              key={name}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium leading-none ${
                unknown.includes(name) ? 'bg-amber-100 text-amber-700' : avatarColor(name)
              }`}
            >
              <span className="max-w-[72px] truncate">{name.split(' ')[0]}</span>
              <button
                onClick={e => remove(name, e)}
                className="ml-0.5 rounded-full hover:bg-black/10 p-0.5 leading-none"
              >
                <X size={9} strokeWidth={2.5} />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          size={11}
          className={`ml-auto self-center text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 w-full min-w-[160px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto py-1">
            {local.length > 0 && (
              <button
                onClick={() => { const next: string[] = []; setLocal(next); onCommit(next); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-gray-400 hover:bg-gray-50 transition-colors"
              >
                <X size={11} /> Clear all
              </button>
            )}
            {unknown.map(name => (
              <label key={name} className="flex items-center gap-2 px-3 py-1.5 hover:bg-amber-50 cursor-pointer">
                <input type="checkbox" checked onChange={() => toggle(name)} className="accent-blue-500 w-3 h-3 shrink-0" />
                <span className={`w-2 h-2 rounded-full shrink-0 ${avatarColor(name)}`} />
                <span className="text-[11px] text-amber-700 truncate flex-1">{name} ⚠️</span>
              </label>
            ))}
            {options.map(name => (
              <label key={name} className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${local.includes(name) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                <input type="checkbox" checked={local.includes(name)} onChange={() => toggle(name)} className="accent-blue-500 w-3 h-3 shrink-0" />
                <span className={`w-2 h-2 rounded-full shrink-0 ${avatarColor(name)}`} />
                <span className={`text-[11px] truncate flex-1 ${local.includes(name) ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>{name}</span>
              </label>
            ))}
            {options.length === 0 && unknown.length === 0 && (
              <p className="px-3 py-2 text-[11px] text-gray-400">No members found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

// ── Select cell ───────────────────────────────────────────────────────────────
const SelectCell = memo(function SelectCell({
  value,
  options,
  onCommit,
}: {
  value: string;
  options: string[];
  onCommit: (val: string) => void;
}) {
  const [local, setLocal] = useState(value ?? '');
  useEffect(() => { setLocal(value ?? ''); }, [value]);

  return (
    <select
      value={local}
      onChange={e => {
        const val = e.target.value;
        setLocal(val);
        onCommit(val);
      }}
      className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
    >
      {options?.map(opt => (
        <option key={opt} value={opt}>{opt || '—'}</option>
      ))}
    </select>
  );
});

// ── Combobox cell — select from existing options or type a new one ───────────
const ComboboxCell = memo(function ComboboxCell({
  value,
  options,
  onCommit,
}: {
  value: string;
  options: string[];
  onCommit: (val: string) => void;
}) {
  const [local, setLocal] = useState(value ?? '');
  const [isCustom, setIsCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setLocal(value ?? ''); setIsCustom(false); }, [value]);
  useEffect(() => { if (isCustom && inputRef.current) inputRef.current.focus(); }, [isCustom]);

  if (isCustom) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={local}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { onCommit(local); setIsCustom(false); }}
        onKeyDown={e => { if (e.key === 'Enter') { onCommit(local); setIsCustom(false); } if (e.key === 'Escape') setIsCustom(false); }}
        className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none"
        placeholder="Type new..."
      />
    );
  }

  // Include current value in options if it's not already there
  const allOpts = options.includes(local) || !local ? options : [local, ...options];

  return (
    <select
      value={local}
      onChange={e => {
        if (e.target.value === '__new__') {
          setLocal('');
          setIsCustom(true);
        } else {
          setLocal(e.target.value);
          onCommit(e.target.value);
        }
      }}
      className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
    >
      <option value="">—</option>
      {allOpts.filter(Boolean).map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
      <option value="__new__">+ Add new...</option>
    </select>
  );
});

// ── Auto-resizing textarea ────────────────────────────────────────────────────
const CellTextarea = memo(function CellTextarea({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (val: string) => void;
}) {
  const [local, setLocal] = useState(value ?? '');
  const isFocused = useRef(false);
  const ref       = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isFocused.current) setLocal(value ?? '');
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [local]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onFocus={() => { isFocused.current = true; }}
      onBlur={() => { isFocused.current = false; onCommit(local); }}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ref.current?.blur(); }
      }}
      className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none resize-none overflow-hidden leading-snug"
    />
  );
});

// ── Number / date input ───────────────────────────────────────────────────────
const CellInput = memo(function CellInput({
  value,
  type,
  onCommit,
}: {
  value: string | number;
  type: 'number' | 'date';
  onCommit: (val: string | number) => void;
}) {
  const [local, setLocal] = useState(String(value ?? ''));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setLocal(String(value ?? ''));
  }, [value]);

  if (type === 'date') {
    return (
      <input
        type="date"
        value={local}
        onChange={e => { setLocal(e.target.value); onCommit(e.target.value); }}
        onFocus={() => { isFocused.current = true; }}
        onBlur={() => { isFocused.current = false; }}
        className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
      />
    );
  }

  return (
    <input
      type="number"
      step="any"
      value={local}
      onChange={e => setLocal(e.target.value)}
      onFocus={() => { isFocused.current = true; }}
      onBlur={() => { isFocused.current = false; onCommit(local === '' ? 0 : parseFloat(local)); }}
      className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none"
    />
  );
});

// ── StableCell ────────────────────────────────────────────────────────────────
// onUpdate is stored in a ref so memo is never broken by a new callback
// reference — this is the main fix for typing delay.
const StableCell = memo(function StableCell({
  rowId,
  colKey,
  col,
  value,
  onUpdate,
  row,
}: {
  rowId: string;
  colKey: string;
  col: ColumnDef;
  value: string | number | string[];
  onUpdate: (id: string, key: string, value: string | number | string[]) => void;
  row?: any;
}) {
  // Keep onUpdate in a ref so the callbacks below are never recreated
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  const handleCommit = useCallback(
    (val: string | number | string[]) => onUpdateRef.current(rowId, colKey, val),
    [rowId, colKey], // intentionally omit onUpdate — ref handles freshness
  );

  if (col.type === 'multi-select') {
    return (
      <MultiSelectCell
        value={Array.isArray(value) ? value : []}
        options={col.options ?? []}
        onCommit={handleCommit as (val: string[]) => void}
      />
    );
  }

  if (col.type === 'select') {
    return (
      <SelectCell
        value={String(value ?? '')}
        options={col.options ?? []}
        onCommit={handleCommit as (val: string) => void}
      />
    );
  }

  if ((col.type as string) === 'combobox') {
    return (
      <ComboboxCell
        value={String(value ?? '')}
        options={col.options ?? []}
        onCommit={handleCommit as (val: string) => void}
      />
    );
  }

  if (col.type === 'text') {
    return (
      <CellTextarea
        value={String(value ?? '')}
        onCommit={handleCommit as (val: string) => void}
      />
    );
  }

  // Read-only progress bar: computes percentage from goal_target and goal_current on the row
  if (col.type === 'progress' as any) {
    const target = Number(row?.goal_target) || 0;
    const current = Number(row?.goal_current) || 0;
    if (target <= 0) {
      return <span className="px-2 py-1.5 text-[11px] text-gray-300 block">—</span>;
    }
    const pct = Math.min(Math.round((current / target) * 100), 100);
    const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
    const textColor = pct >= 80 ? 'text-emerald-700' : pct >= 50 ? 'text-amber-700' : 'text-red-600';
    return (
      <div className="px-2 py-2">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden min-w-[40px]">
            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-[11px] font-bold tabular-nums ${textColor}`}>{pct}%</span>
        </div>
      </div>
    );
  }

  return (
    <CellInput
      value={value as string | number}
      type={col.type === 'date' ? 'date' : 'number'}
      onCommit={handleCommit as (val: string | number) => void}
    />
  );
});

// ── TableRow ──────────────────────────────────────────────────────────────────
const TableRow = memo(function TableRow({
  row,
  idx,
  columns,
  onUpdate,
  onDelete,
  readOnly,
}: {
  row: any;
  idx: number;
  columns: ColumnDef[];
  onUpdate: (id: string, key: string, value: string | number | string[]) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}) {
  return (
    <tr className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'} hover:bg-blue-50/30 transition-colors`}>
      {columns.map(col => (
        <td key={col.key} className="px-1.5 py-1 align-top">
          {readOnly ? (
            <span className="px-2 py-1.5 text-sm text-gray-700 block whitespace-pre-wrap break-words leading-snug">
              {Array.isArray(row[col.key]) ? (row[col.key] as string[]).join(', ') : String(row[col.key] ?? '')}
            </span>
          ) : (
            <StableCell
              rowId={row.id}
              colKey={col.key}
              col={col}
              value={row[col.key] ?? (col.type === 'multi-select' ? [] : '')}
              onUpdate={onUpdate}
              row={row}
            />
          )}
        </td>
      ))}
      {!readOnly && (
        <td className="px-1.5 py-1 text-center align-top">
          <button
            onClick={() => onDelete(row.id)}
            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors mt-0.5"
          >
            <X size={14} />
          </button>
        </td>
      )}
    </tr>
  );
});

// ── SpreadsheetTable ──────────────────────────────────────────────────────────
interface SpreadsheetTableProps {
  columns: ColumnDef[];
  data: any[];
  onUpdate: (id: string, key: string, value: string | number | string[]) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  addLabel: string;
  loading?: boolean;
  readOnly?: boolean;
}

export default function SpreadsheetTable({
  columns,
  data,
  onUpdate,
  onDelete,
  onAdd,
  addLabel,
  loading,
  readOnly,
}: SpreadsheetTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0 && !readOnly) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm mb-4">
          No entries yet. Click &quot;{addLabel}&quot; to start.
        </p>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors"
        >
          <Plus size={15} />
          {addLabel}
        </button>
      </div>
    );
  }

  if (data.length === 0 && readOnly) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">No entries yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="text-left text-[11px] font-bold text-[#475569] uppercase tracking-wider px-3 py-2.5 bg-gray-50/80"
                  style={col.width
                    ? { minWidth: col.width, maxWidth: col.width, width: col.width }
                    : { minWidth: '120px' }
                  }
                >
                  {col.label}
                </th>
              ))}
              {!readOnly && <th className="w-10 bg-gray-50/80" />}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <TableRow
                key={row.id}
                row={row}
                idx={idx}
                columns={columns}
                onUpdate={onUpdate}
                onDelete={onDelete}
                readOnly={readOnly}
              />
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <button
          onClick={onAdd}
          className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors"
        >
          <Plus size={15} />
          {addLabel}
        </button>
      )}
    </div>
  );
}