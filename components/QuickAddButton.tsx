'use client';

import { useState } from 'react';
import { Plus, CheckSquare, Wallet, Users, X } from 'lucide-react';
import QuickAddModal from './QuickAddModal';

type EntityType = 'task' | 'expense' | 'member';

export default function QuickAddButton() {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<EntityType>('task');

  const openModal = (type: EntityType) => {
    setModalType(type);
    setModalOpen(true);
    setExpanded(false);
  };

  const actions = [
    { type: 'member' as EntityType, icon: <Users size={16} />, label: 'Team Member', color: 'bg-violet-500 hover:bg-violet-600' },
    { type: 'expense' as EntityType, icon: <Wallet size={16} />, label: 'Expense', color: 'bg-rose-500 hover:bg-rose-600' },
    { type: 'task' as EntityType, icon: <CheckSquare size={16} />, label: 'Task', color: 'bg-emerald-500 hover:bg-emerald-600' },
  ];

  return (
    <>
      {/* FAB Container */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-end gap-2">
        {/* Sub-actions */}
        {expanded && (
          <div className="flex flex-col-reverse gap-2 mb-1">
            {actions.map((action, i) => (
              <button
                key={action.type}
                onClick={() => openModal(action.type)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg transition-all ${action.color}`}
                style={{
                  animation: `fab-pop-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 50}ms both`,
                }}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200 ${
            expanded
              ? 'bg-gray-700 hover:bg-gray-800 rotate-45'
              : 'bg-[#3b82f6] hover:bg-[#2563eb]'
          }`}
        >
          {expanded ? <X size={22} className="text-white -rotate-45" /> : <Plus size={22} className="text-white" />}
        </button>
      </div>

      {/* Backdrop when expanded */}
      {expanded && (
        <div className="fixed inset-0 z-30" onClick={() => setExpanded(false)} />
      )}

      {/* Modal */}
      <QuickAddModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultType={modalType}
      />

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes fab-pop-in {
          from { opacity: 0; transform: scale(0.8) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}
