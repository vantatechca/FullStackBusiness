
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '@/lib/currency-context';
import { convertToUSD } from '@/lib/exchange-rates';
import type { Revenue, Expense, TeamMember } from '@/lib/types';
import KPICard from './KPICard';

interface Department { id: string; name: string; type: string; }

export default function NetProfitView() {
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { formatDisplay, rates } = useCurrency();

  const fetchAll = useCallback(async () => {
    try {
      const [revRes, expRes, memRes, deptRes] = await Promise.all([
        fetch('/api/table-data?table=revenue'),
        fetch('/api/table-data?table=expenses'),
        fetch('/api/table-data?table=team_members'),
        fetch('/api/table-data?table=departments'),
      ]);
      const [revData, expData, memData, deptData] = await Promise.all([
        revRes.json(), expRes.json(), memRes.json(), deptRes.json(),
      ]);
      setRevenue(Array.isArray(revData) ? revData : []);
      setExpenses(Array.isArray(expData) ? expData : []);
      setMembers(Array.isArray(memData) ? memData : []);
      const DEPT_TYPES = ['standard', 'gmb', 'influencers', 'restock'];
      setDepartments((Array.isArray(deptData) ? deptData : []).filter((d: any) => DEPT_TYPES.includes(d.type)));
    } catch (err) {
      console.error('Failed to fetch net profit data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const totalRevUSD = revenue.reduce((s, r) => s + convertToUSD(Number(r.amount) || 0, r.currency, rates), 0);
  const totalExpUSD = expenses.reduce((s, e) => s + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);
  const netProfit = totalRevUSD - totalExpUSD;

  const deptBreakdown = departments.map(d => {
    const deptRev = revenue
      .filter(r => r.department_id === d.id)
      .reduce((s, r) => s + convertToUSD(Number(r.amount) || 0, r.currency, rates), 0);
    const deptExp = expenses
      .filter(e => e.department_id === d.id)
      .reduce((s, e) => s + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);
    const profit = deptRev - deptExp;
    const margin = deptRev > 0 ? (profit / deptRev) * 100 : null;
    return { name: d.name, revenue: deptRev, expenses: deptExp, profit, margin };
  });

  const totals = deptBreakdown.reduce(
    (acc, d) => ({ revenue: acc.revenue + d.revenue, expenses: acc.expenses + d.expenses, profit: acc.profit + d.profit }),
    { revenue: 0, expenses: 0, profit: 0 }
  );

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total Revenue" value={formatDisplay(totalRevUSD)} color="green" />
        <KPICard title="Total Expenses" value={formatDisplay(totalExpUSD)} color="red" />
        <KPICard title="Net Profit" value={formatDisplay(netProfit)} color={netProfit >= 0 ? 'green' : 'red'} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm">Per-Department Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                {['Department', 'Revenue', 'Expenses', 'Profit', 'Margin'].map(h => (
                  <th key={h} className="text-left text-[11px] font-bold text-[#475569] uppercase tracking-wider px-4 py-2.5 bg-gray-50/80">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deptBreakdown.map((d, idx) => (
                <tr key={d.name} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
                  <td className="px-4 py-2.5 text-gray-900">{d.name}</td>
                  <td className="px-4 py-2.5 text-[#22c55e] font-medium">{formatDisplay(d.revenue)}</td>
                  <td className="px-4 py-2.5 text-[#ef4444] font-medium">{formatDisplay(d.expenses)}</td>
                  <td className={`px-4 py-2.5 font-bold ${d.profit >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {formatDisplay(d.profit)}
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {d.margin !== null ? `${d.margin.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td className="px-4 py-2.5 text-gray-900">TOTAL</td>
                <td className="px-4 py-2.5 text-[#22c55e]">{formatDisplay(totals.revenue)}</td>
                <td className="px-4 py-2.5 text-[#ef4444]">{formatDisplay(totals.expenses)}</td>
                <td className={`px-4 py-2.5 ${totals.profit >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                  {formatDisplay(totals.profit)}
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {totals.revenue > 0 ? `${((totals.profit / totals.revenue) * 100).toFixed(1)}%` : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {members.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-sm">Profit Distribution by Team Member</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {['Name', 'Role', 'Profit %', 'Profit Share'].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold text-[#475569] uppercase tracking-wider px-4 py-2.5 bg-gray-50/80">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => {
                  const share = netProfit * ((Number(m.profit_pct) || 0) / 100);
                  return (
                    <tr key={m.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-[#fafbfc]' : 'bg-white'}`}>
                      <td className="px-4 py-2.5 text-gray-900">{m.name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{m.role}</td>
                      <td className="px-4 py-2.5 text-gray-700">{Number(m.profit_pct).toFixed(1)}%</td>
                      <td className={`px-4 py-2.5 font-bold ${share >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                        {formatDisplay(share)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}