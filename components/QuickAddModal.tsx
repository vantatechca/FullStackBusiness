'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, CheckSquare, Wallet, Users, ChevronDown } from 'lucide-react';
import { CURRENCIES } from '@/lib/types';

type EntityType = 'task' | 'expense' | 'member';

interface Department {
  id: string;
  name: string;
}

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  defaultType?: EntityType;
}

export default function QuickAddModal({ open, onClose, defaultType = 'task' }: QuickAddModalProps) {
  const [entityType, setEntityType] = useState<EntityType>(defaultType);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Task fields
  const [taskName, setTaskName] = useState('');
  const [taskDeptId, setTaskDeptId] = useState('');
  const [taskStatus, setTaskStatus] = useState('To Do');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskRecurrence, setTaskRecurrence] = useState('One-Time');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
  const [taskNotes, setTaskNotes] = useState('');

  // Expense fields
  const [expDeptId, setExpDeptId] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDescription, setExpDescription] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCurrency, setExpCurrency] = useState('USD');
  const [expPaidBy, setExpPaidBy] = useState('');

  // Member fields
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberDepts, setMemberDepts] = useState('');
  const [memberStatus, setMemberStatus] = useState('Active');

  useEffect(() => {
    if (open) {
      setEntityType(defaultType);
      setError('');
      setSuccess('');
      // Fetch departments and members
      fetch('/api/departments').then(r => r.json()).then(d => {
        const filtered = (d || []).filter((dept: any) =>
          dept.type === 'standard' || dept.type === 'gmb' || dept.type === 'influencers' || dept.type === 'restock'
        );
        setDepartments(filtered);
      }).catch(() => {});
      fetch('/api/table-data?table=team_members').then(r => r.json()).then(m => {
        setMembers((m || []).map((member: any) => ({ id: member.id, name: member.name })));
      }).catch(() => {});
    }
  }, [open, defaultType]);

  const resetForm = useCallback(() => {
    setTaskName(''); setTaskDeptId(''); setTaskStatus('To Do'); setTaskPriority('Medium');
    setTaskRecurrence('One-Time'); setTaskDeadline(''); setTaskAssignees([]); setTaskNotes('');
    setExpDeptId(''); setExpDate(new Date().toISOString().split('T')[0]); setExpDescription('');
    setExpCategory(''); setExpAmount(''); setExpCurrency('USD'); setExpPaidBy('');
    setMemberName(''); setMemberRole(''); setMemberEmail(''); setMemberDepts(''); setMemberStatus('Active');
    setError(''); setSuccess('');
  }, []);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (entityType === 'task') {
        if (!taskName.trim()) { setError('Task name is required'); setSubmitting(false); return; }
        const body: any = {
          department_id: taskDeptId || null,
          task: taskName.trim(),
          status: taskStatus,
          priority: taskPriority,
          recurrence: taskRecurrence,
          deadline: taskDeadline || null,
          assignee: taskAssignees[0] || '',
          assignees: taskAssignees,
          notes: taskNotes,
        };
        const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('Failed to create task');
        setSuccess('Task created successfully!');
      } else if (entityType === 'expense') {
        if (!expDescription.trim()) { setError('Description is required'); setSubmitting(false); return; }
        if (!expAmount || Number(expAmount) <= 0) { setError('Amount must be greater than 0'); setSubmitting(false); return; }
        const body: any = {
          department_id: expDeptId || null,
          date: expDate,
          description: expDescription.trim(),
          category: expCategory,
          amount: Number(expAmount),
          currency: expCurrency,
          paid_by: expPaidBy,
        };
        const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('Failed to create expense');
        setSuccess('Expense created successfully!');
        window.dispatchEvent(new Event('expenses-updated'));
      } else if (entityType === 'member') {
        if (!memberName.trim()) { setError('Member name is required'); setSubmitting(false); return; }
        const body = {
          name: memberName.trim(),
          role: memberRole || 'Member',
          email: memberEmail,
          departments: memberDepts,
          status: memberStatus,
          profit_pct: 0,
        };
        const res = await fetch('/api/team-members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('Failed to add team member');
        setSuccess('Team member added successfully!');
      }
      // Auto-close after brief success display
      setTimeout(() => { resetForm(); onClose(); }, 800);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const tabs: { key: EntityType; label: string; icon: React.ReactNode }[] = [
    { key: 'task', label: 'Task', icon: <CheckSquare size={14} /> },
    { key: 'expense', label: 'Expense', icon: <Wallet size={14} /> },
    { key: 'member', label: 'Team Member', icon: <Users size={14} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Quick Add</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Entity Type Tabs */}
        <div className="flex gap-1 px-6 pt-4 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setEntityType(tab.key); setError(''); setSuccess(''); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                entityType === tab.key
                  ? 'bg-[#3b82f6] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* ── TASK FORM ── */}
          {entityType === 'task' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Task Name *</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Department <span className="text-gray-300 font-normal normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <select
                    value={taskDeptId}
                    onChange={e => setTaskDeptId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none appearance-none bg-white transition-all"
                  >
                    <option value="">No department (general task)</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={taskStatus} onChange={e => setTaskStatus(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white">
                    <option>To Do</option><option>In Progress</option><option>Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white">
                    <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Recurrence</label>
                  <select value={taskRecurrence} onChange={e => setTaskRecurrence(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white">
                    <option>One-Time</option><option>Daily</option><option>Weekly</option><option>Monthly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Deadline</label>
                <input type="date" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Assignees <span className="text-gray-300 font-normal normal-case">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {taskAssignees.map(name => (
                    <span key={name} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                      {name}
                      <button onClick={() => setTaskAssignees(prev => prev.filter(n => n !== name))} className="text-blue-400 hover:text-blue-600"><X size={12} /></button>
                    </span>
                  ))}
                </div>
                {members.length > 0 && (
                  <select
                    value=""
                    onChange={e => {
                      if (e.target.value && !taskAssignees.includes(e.target.value)) {
                        setTaskAssignees(prev => [...prev, e.target.value]);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white"
                  >
                    <option value="">Add an assignee...</option>
                    {members.filter(m => !taskAssignees.includes(m.name)).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={taskNotes} onChange={e => setTaskNotes(e.target.value)} placeholder="Additional details..." rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none resize-none" />
              </div>
            </>
          )}

          {/* ── EXPENSE FORM ── */}
          {entityType === 'expense' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description *</label>
                <input type="text" value={expDescription} onChange={e => setExpDescription(e.target.value)} placeholder="What was the expense for?" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Department <span className="text-gray-300 font-normal normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <select value={expDeptId} onChange={e => setExpDeptId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white">
                    <option value="">No department (general expense)</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount *</label>
                  <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Currency</label>
                  <select value={expCurrency} onChange={e => setExpCurrency(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white">
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                  <input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                  <input type="text" value={expCategory} onChange={e => setExpCategory(e.target.value)} placeholder="e.g. Software, Office, Travel" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Paid By</label>
                <input type="text" value={expPaidBy} onChange={e => setExpPaidBy(e.target.value)} placeholder="Who paid?" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
              </div>
            </>
          )}

          {/* ── TEAM MEMBER FORM ── */}
          {entityType === 'member' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                <input type="text" value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="John Doe" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Role</label>
                  <input type="text" value={memberRole} onChange={e => setMemberRole(e.target.value)} placeholder="e.g. Developer, Designer" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={memberStatus} onChange={e => setMemberStatus(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white">
                    <option>Active</option><option>On Leave</option><option>Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="john@company.com" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Departments <span className="text-gray-300 font-normal normal-case">(comma-separated)</span>
                </label>
                <input type="text" value={memberDepts} onChange={e => setMemberDepts(e.target.value)} placeholder="e.g. shopify, google-ads" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
              </div>
            </>
          )}

          {/* Error / Success */}
          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium">{error}</div>
          )}
          {success && (
            <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-600 font-medium">{success}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={() => { resetForm(); onClose(); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Creating...' : `Create ${entityType === 'task' ? 'Task' : entityType === 'expense' ? 'Expense' : 'Member'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
