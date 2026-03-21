// 'use client';

// import { X, Plus } from 'lucide-react';
// import type { ColumnDef } from '@/lib/types';

// /* eslint-disable @typescript-eslint/no-explicit-any */
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
//               {!readOnly && (
//                 <th className="w-10 bg-gray-50/80" />
//               )}
//             </tr>
//           </thead>
//           <tbody>
//             {data.map((row, idx) => (
//               <tr
//                 key={row.id}
//                 className={`border-b border-gray-100 ${
//                   idx % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'
//                 } hover:bg-blue-50/30 transition-colors`}
//               >
//                 {columns.map(col => (
//                   <td key={col.key} className="px-1.5 py-1">
//                     {readOnly ? (
//                       <span className="px-2 py-1 text-sm text-gray-700 block truncate">
//                         {String(row[col.key] ?? '')}
//                       </span>
//                     ) : col.type === 'select' ? (
//                       <select
//                         value={String(row[col.key] ?? '')}
//                         onChange={e => onUpdate(row.id, col.key, e.target.value)}
//                         className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
//                       >
//                         {col.options?.map(opt => (
//                           <option key={opt} value={opt}>{opt}</option>
//                         ))}
//                       </select>
//                     ) : (
//                       <input
//                         type={col.type === 'number' ? 'number' : 'text'}
//                         step={col.type === 'number' ? 'any' : undefined}
//                         value={String(row[col.key] ?? '')}
//                         onChange={e => {
//                           const val = col.type === 'number' ? (e.target.value === '' ? 0 : parseFloat(e.target.value)) : e.target.value;
//                           onUpdate(row.id, col.key, val);
//                         }}
//                         onBlur={e => {
//                           const val = col.type === 'number' ? (e.target.value === '' ? 0 : parseFloat(e.target.value)) : e.target.value;
//                           onUpdate(row.id, col.key, val);
//                         }}
//                         className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none"
//                       />
//                     )}
//                   </td>
//                 ))}
//                 {!readOnly && (
//                   <td className="px-1.5 py-1 text-center">
//                     <button
//                       onClick={() => onDelete(row.id)}
//                       className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
//                     >
//                       <X size={14} />
//                     </button>
//                   </td>
//                 )}
//               </tr>
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

const CellInput = memo(function CellInput({
  value,
  type,
  onCommit,
}: {
  value: string | number;
  type: 'text' | 'number' | 'date';
  onCommit: (val: string | number) => void;
}) {
  const [local, setLocal] = useState(String(value ?? ''));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocal(String(value ?? ''));
    }
  }, [value]);

  if (type === 'date') {
    return (
      <input
        type="date"
        value={local}
        onChange={e => {
          setLocal(e.target.value);
          onCommit(e.target.value); // commit immediately on change for date pickers
        }}
        onFocus={() => { isFocused.current = true; }}
        onBlur={() => { isFocused.current = false; }}
        className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
      />
    );
  }

  return (
    <input
      type={type === 'number' ? 'number' : 'text'}
      step={type === 'number' ? 'any' : undefined}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onFocus={() => { isFocused.current = true; }}
      onBlur={() => {
        isFocused.current = false;
        const val = type === 'number'
          ? (local === '' ? 0 : parseFloat(local))
          : local;
        onCommit(val);
      }}
      className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none"
    />
  );
});

/* eslint-disable @typescript-eslint/no-explicit-any */

const StableCell = memo(function StableCell({
  rowId,
  colKey,
  value,
  type,
  onUpdate,
}: {
  rowId: string;
  colKey: string;
  value: string | number;
  type: 'text' | 'number' | 'date';
  onUpdate: (id: string, key: string, value: string | number) => void;
}) {
  const handleCommit = useCallback(
    (val: string | number) => onUpdate(rowId, colKey, val),
    [rowId, colKey, onUpdate]
  );
  return <CellInput value={value} type={type} onCommit={handleCommit} />;
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
        <td key={col.key} className="px-1.5 py-1">
          {readOnly ? (
            <span className="px-2 py-1 text-sm text-gray-700 block truncate">
              {String(row[col.key] ?? '')}
            </span>
          ) : col.type === 'select' ? (
            <select
              value={String(row[col.key] ?? '')}
              onChange={e => onUpdate(row.id, col.key, e.target.value)}
              className="w-full px-2 py-1.5 text-sm border-0 bg-transparent rounded focus:ring-1 focus:ring-[#3b82f6] outline-none cursor-pointer"
            >
              {col.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <StableCell
              rowId={row.id}
              colKey={col.key}
              value={row[col.key] ?? ''}
              type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
              onUpdate={onUpdate}
            />
          )}
        </td>
      ))}
      {!readOnly && (
        <td className="px-1.5 py-1 text-center">
          <button
            onClick={() => onDelete(row.id)}
            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
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
                  style={col.width ? { minWidth: col.width } : { minWidth: '120px' }}
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