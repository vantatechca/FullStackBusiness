'use client';

interface KPICardProps {
  title: string;
  value: string;
  color: 'green' | 'red' | 'blue' | 'amber';
  subtitle?: string;
}

const colorMap = {
  green: { bg: 'bg-green-50', border: 'border-green-100', text: 'text-[#22c55e]' },
  red: { bg: 'bg-red-50', border: 'border-red-100', text: 'text-[#ef4444]' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-[#3b82f6]' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-[#f59e0b]' },
};

export default function KPICard({ title, value, color, subtitle }: KPICardProps) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl px-5 py-4`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
