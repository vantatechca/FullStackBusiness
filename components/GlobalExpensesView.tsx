// 'use client';

// import { useState, useEffect } from 'react';
// import { supabase } from '@/lib/supabase';
// import { getDepartment } from '@/lib/departments';
// import { useCurrency } from '@/lib/currency-context';
// import { convertToUSD } from '@/lib/exchange-rates';
// import type { Expense } from '@/lib/types';

// export default function GlobalExpensesView() {
//   const [expenses, setExpenses] = useState<(Expense & { dept_name: string })[]>([]);
//   const [loading, setLoading] = useState(true);
//   const { formatDisplay, rates } = useCurrency();

// useEffect(() => {
//   const fetchExpenses = async () => {
//     const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
//     if (data) {
//       setExpenses(data.map(e => ({
//         ...e,
//         dept_name: getDepartment(e.department_id)?.name || e.department_id,
//       })));
//     }
//     setLoading(false);
//   };
//   fetchExpenses();

//   const channel = supabase
//     .channel('global-expenses')
//     .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
//       fetchExpenses();
//     })
//     .subscribe();

//   // ← add this: listen for deletes from ExpensesSection
//   const handler = () => fetchExpenses();
//   window.addEventListener('expenses-updated', handler);

//   return () => {
//     supabase.removeChannel(channel);
//     window.removeEventListener('expenses-updated', handler); // ← and cleanup
//   };
// }, []);


//   const totalUSD = expenses.reduce((sum, e) => sum + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);

//   if (loading) {
//     return <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>;
//   }

//   return (
//     <div>
//       <div className="mb-5">
//         <span className="text-lg font-bold text-[#ef4444]">
//           Total Expenses Across All Departments: {formatDisplay(totalUSD)}
//         </span>
//       </div>

//       {expenses.length === 0 ? (
//         <p className="text-center py-12 text-gray-400 text-sm">No expenses recorded yet.</p>
//       ) : (
//         <div className="overflow-x-auto border border-gray-200 rounded-lg">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="border-b-2 border-gray-200">
//                 {['Department', 'Date', 'Description', 'Category', 'Amount', 'Currency', 'Paid By'].map(h => (
//                   <th key={h} className="text-left text-[11px] font-bold text-[#475569] uppercase tracking-wider px-3 py-2.5 bg-gray-50/80">
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {expenses.map((exp, idx) => (
//                 <tr key={exp.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
//                   <td className="px-3 py-2 text-gray-700">{exp.dept_name}</td>
//                   <td className="px-3 py-2 text-gray-600">{exp.date}</td>
//                   <td className="px-3 py-2 text-gray-900">{exp.description}</td>
//                   <td className="px-3 py-2 text-gray-600">{exp.category}</td>
//                   <td className="px-3 py-2 text-[#ef4444] font-medium">{Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
//                   <td className="px-3 py-2 text-gray-500">{exp.currency}</td>
//                   <td className="px-3 py-2 text-gray-600">{exp.paid_by}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }






















'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDepartment } from '@/lib/departments';
import { useCurrency } from '@/lib/currency-context';
import { convertToUSD } from '@/lib/exchange-rates';
import type { Expense } from '@/lib/types';

export default function GlobalExpensesView() {
  const [expenses, setExpenses] = useState<(Expense & { dept_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatDisplay, rates } = useCurrency();

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch('/api/table-data?table=expenses');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setExpenses(
        [...data]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .map(e => ({
            ...e,
            dept_name: getDepartment(e.department_id)?.name || e.department_id,
          }))
      );
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();

    // Poll every 30 seconds
    const interval = setInterval(fetchExpenses, 30000);

    // Listen for updates from ExpensesSection
    window.addEventListener('expenses-updated', fetchExpenses);

    return () => {
      clearInterval(interval);
      window.removeEventListener('expenses-updated', fetchExpenses);
    };
  }, [fetchExpenses]);

  const totalUSD = expenses.reduce((sum, e) => sum + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);

  if (loading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>;
  }

  return (
    <div>
      <div className="mb-5">
        <span className="text-lg font-bold text-[#ef4444]">
          Total Expenses Across All Departments: {formatDisplay(totalUSD)}
        </span>
      </div>

      {expenses.length === 0 ? (
        <p className="text-center py-12 text-gray-400 text-sm">No expenses recorded yet.</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {['Department', 'Date', 'Description', 'Category', 'Amount', 'Currency', 'Paid By'].map(h => (
                  <th key={h} className="text-left text-[11px] font-bold text-[#475569] uppercase tracking-wider px-3 py-2.5 bg-gray-50/80">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp, idx) => (
                <tr key={exp.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
                  <td className="px-3 py-2 text-gray-700">{exp.dept_name}</td>
                  <td className="px-3 py-2 text-gray-600">{exp.date}</td>
                  <td className="px-3 py-2 text-gray-900">{exp.description}</td>
                  <td className="px-3 py-2 text-gray-600">{exp.category}</td>
                  <td className="px-3 py-2 text-[#ef4444] font-medium">{Number(exp.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="px-3 py-2 text-gray-500">{exp.currency}</td>
                  <td className="px-3 py-2 text-gray-600">{exp.paid_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}







