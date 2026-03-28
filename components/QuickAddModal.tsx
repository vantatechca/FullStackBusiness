'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { CURRENCIES } from '@/lib/types';

type EntityType = 'task' | 'expense' | 'member';

interface Department { id: string; name: string; }

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  entityType: EntityType;
}

function ModalShell({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none transition-all";
const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5";
const selectCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white";

export default function QuickAddModal({ open, onClose, entityType }: QuickAddModalProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Task
  const [taskName, setTaskName] = useState('');
  const [taskDeptId, setTaskDeptId] = useState('');
  const [taskStatus, setTaskStatus] = useState('To Do');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskRecurrence, setTaskRecurrence] = useState('One-Time');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
  const [taskGoalTarget, setTaskGoalTarget] = useState('');
  const [taskNotes, setTaskNotes] = useState('');

  // Expense
  const [expDeptId, setExpDeptId] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expDescription, setExpDescription] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCurrency, setExpCurrency] = useState('USD');
  const [expPaidBy, setExpPaidBy] = useState('');

  // Member
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberDepts, setMemberDepts] = useState('');
  const [memberStatus, setMemberStatus] = useState('Active');

  useEffect(() => {
    if (!open) return;
    setError(''); setSuccess('');
    fetch('/api/departments').then(r => r.json()).then(d => {
      setDepartments((Array.isArray(d) ? d : []).filter((dept: any) =>
        ['standard', 'gmb', 'influencers', 'restock'].includes(dept.type)
      ));
    }).catch(() => {});
    if (entityType === 'task') {
      fetch('/api/table-data?table=team_members').then(r => r.json()).then(m => {
        setMembers((Array.isArray(m) ? m : []).map((member: any) => ({ id: member.id, name: member.name })));
      }).catch(() => {});
    }
  }, [open, entityType]);

  const resetForm = useCallback(() => {
    setTaskName(''); setTaskDeptId(''); setTaskStatus('To Do'); setTaskPriority('Medium');
    setTaskRecurrence('One-Time'); setTaskDeadline(''); setTaskAssignees([]); setTaskGoalTarget(''); setTaskNotes('');
    setExpDeptId(''); setExpDate(new Date().toISOString().split('T')[0]); setExpDescription('');
    setExpCategory(''); setExpAmount(''); setExpCurrency('USD'); setExpPaidBy('');
    setMemberName(''); setMemberRole(''); setMemberEmail(''); setMemberDepts(''); setMemberStatus('Active');
    setError(''); setSuccess('');
  }, []);

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      if (entityType === 'task') {
        if (!taskName.trim()) { setError('Task name is required'); setSubmitting(false); return; }
        const res = await fetch('/api/tasks', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            department_id: taskDeptId || null, task: taskName.trim(),
            status: taskStatus, priority: taskPriority, recurrence: taskRecurrence,
            deadline: taskDeadline || null, assignee: taskAssignees[0] || '',
            assignees: taskAssignees, notes: taskNotes,
            goal_target: Number(taskGoalTarget) || 0, goal_current: 0,
          }),
        });
        if (!res.ok) throw new Error('Failed to create task');
        setSuccess('Task created!');
      } else if (entityType === 'expense') {
        if (!expDescription.trim()) { setError('Description is required'); setSubmitting(false); return; }
        if (!expAmount || Number(expAmount) <= 0) { setError('Amount must be greater than 0'); setSubmitting(false); return; }
        const res = await fetch('/api/expenses', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            department_id: expDeptId || null, date: expDate,
            description: expDescription.trim(), category: expCategory,
            amount: Number(expAmount), currency: expCurrency, paid_by: expPaidBy,
          }),
        });
        if (!res.ok) throw new Error('Failed to create expense');
        setSuccess('Expense created!');
        window.dispatchEvent(new Event('expenses-updated'));
      } else if (entityType === 'member') {
        if (!memberName.trim()) { setError('Member name is required'); setSubmitting(false); return; }
        const res = await fetch('/api/team-members', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: memberName.trim(), role: memberRole || 'Member',
            email: memberEmail, departments: memberDepts,
            status: memberStatus, profit_pct: 0,
          }),
        });
        if (!res.ok) throw new Error('Failed to add team member');
        setSuccess('Team member added!');
      }
      setTimeout(() => { handleClose(); }, 600);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const titles = { task: 'Add Task', expense: 'Add Expense', member: 'Add Team Member' };
  const btnLabels = { task: 'Create Task', expense: 'Create Expense', member: 'Add Member' };

  return (
    <ModalShell open={open} onClose={handleClose} title={titles[entityType]}>
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

        {/* ── TASK ── */}
        {entityType === 'task' && (
          <>
            <div>
              <label className={labelCls}>Task Name *</label>
              <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="What needs to be done?" className={inputCls} autoFocus />
            </div>
            <div>
              <label className={labelCls}>Department <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
              <div className="relative">
                <select value={taskDeptId} onChange={e => setTaskDeptId(e.target.value)} className={selectCls}>
                  <option value="">No department (general task)</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelCls}>Status</label><select value={taskStatus} onChange={e => setTaskStatus(e.target.value)} className={selectCls}><option>To Do</option><option>In Progress</option><option>Done</option></select></div>
              <div><label className={labelCls}>Priority</label><select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className={selectCls}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></div>
              <div><label className={labelCls}>Recurrence</label><select value={taskRecurrence} onChange={e => setTaskRecurrence(e.target.value)} className={selectCls}><option>One-Time</option><option>Daily</option><option>Weekly</option><option>Monthly</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Deadline</label><input type="date" value={taskDeadline} onChange={e => setTaskDeadline(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Goal Target <span className="text-gray-300 font-normal normal-case">(optional)</span></label><input type="number" value={taskGoalTarget} onChange={e => setTaskGoalTarget(e.target.value)} placeholder="e.g. 20" min="0" className={inputCls} /></div>
            </div>
            <div>
              <label className={labelCls}>Assignees <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {taskAssignees.map(name => (
                  <span key={name} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                    {name}<button onClick={() => setTaskAssignees(prev => prev.filter(n => n !== name))} className="text-blue-400 hover:text-blue-600"><X size={12} /></button>
                  </span>
                ))}
              </div>
              {members.length > 0 && (
                <select value="" onChange={e => { if (e.target.value && !taskAssignees.includes(e.target.value)) setTaskAssignees(prev => [...prev, e.target.value]); }} className={`${selectCls} text-gray-500`}>
                  <option value="">Add an assignee...</option>
                  {members.filter(m => !taskAssignees.includes(m.name)).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              )}
            </div>
            <div><label className={labelCls}>Notes</label><textarea value={taskNotes} onChange={e => setTaskNotes(e.target.value)} placeholder="Additional details..." rows={2} className={`${inputCls} resize-none`} /></div>
          </>
        )}

        {/* ── EXPENSE ── */}
        {entityType === 'expense' && (
          <>
            <div><label className={labelCls}>Description *</label><input type="text" value={expDescription} onChange={e => setExpDescription(e.target.value)} placeholder="What was the expense for?" className={inputCls} autoFocus /></div>
            <div>
              <label className={labelCls}>Department <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
              <div className="relative">
                <select value={expDeptId} onChange={e => setExpDeptId(e.target.value)} className={selectCls}>
                  <option value="">No department (general expense)</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Amount *</label><input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" className={inputCls} /></div>
              <div><label className={labelCls}>Currency</label><select value={expCurrency} onChange={e => setExpCurrency(e.target.value)} className={selectCls}>{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Date</label><input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Category</label><input type="text" value={expCategory} onChange={e => setExpCategory(e.target.value)} placeholder="e.g. Software, Office" className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Paid By</label><input type="text" value={expPaidBy} onChange={e => setExpPaidBy(e.target.value)} placeholder="Who paid?" className={inputCls} /></div>
          </>
        )}

        {/* ── MEMBER ── */}
        {entityType === 'member' && (
          <>
            <div><label className={labelCls}>Full Name *</label><input type="text" value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="John Doe" className={inputCls} autoFocus /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelCls}>Role</label><input type="text" value={memberRole} onChange={e => setMemberRole(e.target.value)} placeholder="e.g. Developer" className={inputCls} /></div>
              <div><label className={labelCls}>Status</label><select value={memberStatus} onChange={e => setMemberStatus(e.target.value)} className={selectCls}><option>Active</option><option>On Leave</option><option>Inactive</option></select></div>
            </div>
            <div><label className={labelCls}>Email</label><input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="john@company.com" className={inputCls} /></div>
            <div><label className={labelCls}>Departments <span className="text-gray-300 font-normal normal-case">(comma-separated)</span></label><input type="text" value={memberDepts} onChange={e => setMemberDepts(e.target.value)} placeholder="e.g. shopify, google-ads" className={inputCls} /></div>
          </>
        )}

        {error && <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium">{error}</div>}
        {success && <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-sm text-emerald-600 font-medium">{success}</div>}
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm disabled:opacity-50">
          {submitting ? 'Creating...' : btnLabels[entityType]}
        </button>
      </div>
    </ModalShell>
  );
}
