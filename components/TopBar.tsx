'use client';

import { usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { getDepartment, DEPARTMENT_ICONS } from '@/lib/departments';
import { useCurrency } from '@/lib/currency-context';
import { CURRENCIES } from '@/lib/types';

export default function TopBar() {
  const pathname = usePathname();
  const { displayCurrency, setDisplayCurrency, refreshRates, ratesLoading } = useCurrency();

  const deptId = pathname === '/dashboard'
    ? 'dashboard'
    : pathname.replace('/dashboard/', '');

  const dept = getDepartment(deptId);
  const Icon = dept ? DEPARTMENT_ICONS[dept.icon] : null;
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {Icon && <Icon size={22} className="text-[#3b82f6]" />}
        <h1 className="text-lg font-bold text-gray-900 truncate">
          {dept?.name || 'Dashboard'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <select
            value={displayCurrency}
            onChange={e => setDisplayCurrency(e.target.value)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:ring-1 focus:ring-[#3b82f6] outline-none"
          >
            {CURRENCIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={refreshRates}
            disabled={ratesLoading}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh exchange rates"
          >
            <RefreshCw size={14} className={ratesLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <span className="text-sm text-gray-500 hidden md:block">{today}</span>
      </div>
    </header>
  );
}
