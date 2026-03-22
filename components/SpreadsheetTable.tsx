

// 'use client';

// import { useState, useEffect, useRef, memo, useCallback } from 'react';
// import { X, Plus } from 'lucide-react';
// import type { ColumnDef } from '@/lib/types';

// const CellInput = memo(function CellInput({
//   value,
//   type,
//   onCommit,
// }: {
//   value: string | number;
//   type: 'text' | 'number' | 'date';
//   onCommit: (val: string | number) => void;
// }) {
//   const [local, setLocal] = useState(String(value ?? ''));
//   const isFocused = useRef(false);

//   useEffect(() => {
//     if (!isFocused.current) {
//       setLocal(String(value ?? ''));
//     }
//   }, [value]);

//   if (type === 'date') {
//     return (
//       <input
//         type="date"
//         value={local}
//         onChange={e => {
//           setLocal(e.target.value);
//           onCommit(e.target.value); // commit immediately on change for date pickers
//         }}
//         onFocus={() => { isFocused.current = true; }}
//         onBlur={() => { isFocused.current = false; }}
//         className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
//       />
//     );
//   }

//   return (
//     <input
//       type={type === 'number' ? 'number' : 'text'}
//       step={type === 'number' ? 'any' : undefined}
//       value={local}
//       onChange={e => setLocal(e.target.value)}
//       onFocus={() => { isFocused.current = true; }}
//       onBlur={() => {
//         isFocused.current = false;
//         const val = type === 'number'
//           ? (local === '' ? 0 : parseFloat(local))
//           : local;
//         onCommit(val);
//       }}
//       className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none"
//     />
//   );
// });

// /* eslint-disable @typescript-eslint/no-explicit-any */

// const StableCell = memo(function StableCell({
//   rowId,
//   colKey,
//   value,
//   type,
//   onUpdate,
// }: {
//   rowId: string;
//   colKey: string;
//   value: string | number;
//   type: 'text' | 'number' | 'date';
//   onUpdate: (id: string, key: string, value: string | number) => void;
// }) {
//   const handleCommit = useCallback(
//     (val: string | number) => onUpdate(rowId, colKey, val),
//     [rowId, colKey, onUpdate]
//   );
//   return <CellInput value={value} type={type} onCommit={handleCommit} />;
// });

// const TableRow = memo(function TableRow({
//   row,
//   idx,
//   columns,
//   onUpdate,
//   onDelete,
//   readOnly,
// }: {
//   row: any;
//   idx: number;
//   columns: ColumnDef[];
//   onUpdate: (id: string, key: string, value: string | number) => void;
//   onDelete: (id: string) => void;
//   readOnly?: boolean;
// }) {
//   return (
//     <tr
//       className={`border-b border-gray-100 ${
//         idx % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'
//       } hover:bg-blue-50/30 transition-colors`}
//     >
//       {columns.map(col => (
//         <td key={col.key} className="px-1.5 py-1">
//           {readOnly ? (
//             <span className="px-2 py-1 text-sm text-gray-700 block truncate">
//               {String(row[col.key] ?? '')}
//             </span>
//           ) : col.type === 'select' ? (
//             <select
//               value={String(row[col.key] ?? '')}
//               onChange={e => onUpdate(row.id, col.key, e.target.value)}
//               className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
//             >
//               {col.options?.map(opt => (
//                 <option key={opt} value={opt}>{opt}</option>
//               ))}
//             </select>
//           ) : (
//             <StableCell
//               rowId={row.id}
//               colKey={col.key}
//               value={row[col.key] ?? ''}
//               type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
//               onUpdate={onUpdate}
//             />
//           )}
//         </td>
//       ))}
//       {!readOnly && (
//         <td className="px-1.5 py-1 text-center">
//           <button
//             onClick={() => onDelete(row.id)}
//             className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
//           >
//             <X size={14} />
//           </button>
//         </td>
//       )}
//     </tr>
//   );
// });

// interface SpreadsheetTableProps {
//   columns: ColumnDef[];
//   data: any[];
//   onUpdate: (id: string, key: string, value: string | number) => void;
//   onDelete: (id: string) => void;
//   onAdd: () => void;
//   addLabel: string;
//   loading?: boolean;
//   readOnly?: boolean;
// }

// export default function SpreadsheetTable({
//   columns,
//   data,
//   onUpdate,
//   onDelete,
//   onAdd,
//   addLabel,
//   loading,
//   readOnly,
// }: SpreadsheetTableProps) {
//   if (loading) {
//     return (
//       <div className="space-y-2">
//         {[...Array(3)].map((_, i) => (
//           <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
//         ))}
//       </div>
//     );
//   }

//   if (data.length === 0 && !readOnly) {
//     return (
//       <div className="text-center py-12">
//         <p className="text-gray-400 text-sm mb-4">
//           No entries yet. Click &quot;{addLabel}&quot; to start.
//         </p>
//         <button
//           onClick={onAdd}
//           className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors"
//         >
//           <Plus size={15} />
//           {addLabel}
//         </button>
//       </div>
//     );
//   }

//   if (data.length === 0 && readOnly) {
//     return (
//       <div className="text-center py-12">
//         <p className="text-gray-400 text-sm">No entries yet.</p>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="overflow-x-auto border border-gray-200 rounded-lg">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="border-b-2 border-gray-200">
//               {columns.map(col => (
//                 <th
//                   key={col.key}
//                   className="text-left text-[11px] font-bold text-[#475569] uppercase tracking-wider px-3 py-2.5 bg-gray-50/80"
//                   style={col.width ? { minWidth: col.width } : { minWidth: '120px' }}
//                 >
//                   {col.label}
//                 </th>
//               ))}
//               {!readOnly && <th className="w-10 bg-gray-50/80" />}
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((row, idx) => (
//               <TableRow
//                 key={row.id}
//                 row={row}
//                 idx={idx}
//                 columns={columns}
//                 onUpdate={onUpdate}
//                 onDelete={onDelete}
//                 readOnly={readOnly}
//               />
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {!readOnly && (
//         <button
//           onClick={onAdd}
//           className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors"
//         >
//           <Plus size={15} />
//           {addLabel}
//         </button>
//       )}
//     </div>
//   );
// }



'use client';

import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import type { ColumnDef } from '@/lib/types';

// ── Select cell with local state — change appears instantly ──────────────────
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

  // Sync if parent value changes externally (e.g. poll refetch)
  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  return (
    <select
      value={local}
      onChange={e => {
        const val = e.target.value;
        setLocal(val);  // instant visual update
        onCommit(val);  // fire optimistic update up the tree
      }}
      className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
    >
      {options?.map(opt => (
        <option key={opt} value={opt}>{opt || '—'}</option>
      ))}
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
  const ref = useRef<HTMLTextAreaElement>(null);

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
      onBlur={() => {
        isFocused.current = false;
        onCommit(local);
      }}
      onKeyDown={e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          ref.current?.blur();
        }
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
        onChange={e => {
          setLocal(e.target.value);
          onCommit(e.target.value);
        }}
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
      onBlur={() => {
        isFocused.current = false;
        onCommit(local === '' ? 0 : parseFloat(local));
      }}
      className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none"
    />
  );
});

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Unified stable cell — routes to correct input type ───────────────────────
const StableCell = memo(function StableCell({
  rowId,
  colKey,
  col,
  value,
  onUpdate,
}: {
  rowId: string;
  colKey: string;
  col: ColumnDef;
  value: string | number;
  onUpdate: (id: string, key: string, value: string | number) => void;
}) {
  const handleCommit = useCallback(
    (val: string | number) => onUpdate(rowId, colKey, val),
    [rowId, colKey, onUpdate]
  );

  if (col.type === 'select') {
    return (
      <SelectCell
        value={String(value ?? '')}
        options={col.options ?? []}
        onCommit={handleCommit}
      />
    );
  }

  if (col.type === 'text') {
    return <CellTextarea value={String(value ?? '')} onCommit={handleCommit} />;
  }

  return (
    <CellInput
      value={value}
      type={col.type === 'date' ? 'date' : 'number'}
      onCommit={handleCommit}
    />
  );
});

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
  onUpdate: (id: string, key: string, value: string | number) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
}) {
  return (
    <tr
      className={`border-b border-gray-100 ${
        idx % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'
      } hover:bg-blue-50/30 transition-colors`}
    >
      {columns.map(col => (
        <td key={col.key} className="px-1.5 py-1 align-top">
          {readOnly ? (
            <span className="px-2 py-1.5 text-sm text-gray-700 block whitespace-pre-wrap break-words leading-snug">
              {String(row[col.key] ?? '')}
            </span>
          ) : (
            <StableCell
              rowId={row.id}
              colKey={col.key}
              col={col}
              value={row[col.key] ?? ''}
              onUpdate={onUpdate}
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

interface SpreadsheetTableProps {
  columns: ColumnDef[];
  data: any[];
  onUpdate: (id: string, key: string, value: string | number) => void;
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