'use client';

import { useState } from 'react';

interface SubTabsProps {
  tabs: { id: string; label: string }[];
  children: (activeTab: string) => React.ReactNode;
}

export default function SubTabs({ tabs, children }: SubTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id || '');

  return (
    <div>
      <div className="flex gap-1 mb-5 border-b border-gray-200 pb-px">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px ${
              active === tab.id
                ? 'bg-white text-[#3b82f6] border border-gray-200 border-b-white'
                : 'text-gray-500 hover:text-gray-700 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  );
}
