'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Target, Plus, X, ChevronDown, Trash2, TrendingUp,
  DollarSign, CheckSquare, Star, AlertCircle, CheckCircle2,
  Pencil,
} from 'lucide-react';
import { useCurrency } from '@/lib/currency-context';
import { convertToUSD } from '@/lib/exchange-rates';
import { CURRENCIES } from '@/lib/types';
import type { Goal, Revenue, Expense, Task } from '@/lib/types';

interface Department {
  id: string;
  name: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  revenue: { label: 'Revenue',  icon: <DollarSign size={14} />,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  expense: { label: 'Expense',  icon: <TrendingUp size={14} />,  color: 'text-rose-600',    bg: 'bg-rose-50 border-rose-200'       },
  task:    { label: 'Task',     icon: <CheckSquare size={14} />, color: 'text-violet-600',  bg: 'bg-violet-50 border-violet-200'   },
  custom:  { label: 'Custom',   icon: <Star size={14} />,        color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200'     },
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:    { label: 'Active',    cls: 'bg-blue-50 text-blue-700 border-blue-200'       },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  missed:    { label: 'Missed',    cls: 'bg-rose-50 text-rose-600 border-rose-200'       },
};

export default function GoalsView({ departmentId }: { departmentId?: string }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'missed'>('all');

  // Live data for auto-calculating progress
  const [liveRevenue, setLiveRevenue] = useState<Revenue[]>([]);
  const [liveExpenses, setLiveExpenses] = useState<Expense[]>([]);
  const [liveTasks, setLiveTasks] = useState<Task[]>([]);

  const { formatDisplay, rates } = useCurrency();

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'revenue' | 'expense' | 'task' | 'custom'>('revenue');
  const [formTarget, setFormTarget] = useState('');
  const [formCurrent, setFormCurrent] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formDeptId, setFormDeptId] = useState(departmentId || '');
  const [formPeriod, setFormPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>('monthly');
  const [formStartDate, setFormStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formEndDate, setFormEndDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const url = departmentId ? `/api/goals?deptId=${departmentId}` : '/api/goals';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setGoals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  const fetchLiveData = useCallback(async () => {
    try {
      const [revRes, expRes, taskRes] = await Promise.all([
        fetch('/api/table-data?table=revenue'),
        fetch('/api/table-data?table=expenses'),
        fetch('/api/table-data?table=tasks'),
      ]);
      if (revRes.ok) { const d = await revRes.json(); setLiveRevenue(Array.isArray(d) ? d : []); }
      if (expRes.ok) { const d = await expRes.json(); setLiveExpenses(Array.isArray(d) ? d : []); }
      if (taskRes.ok) { const d = await taskRes.json(); setLiveTasks(Array.isArray(d) ? d : []); }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchGoals();
    fetchLiveData();
    fetch('/api/departments').then(r => r.json()).then(d => {
      setDepartments((d || []).filter((dept: any) =>
        ['standard', 'gmb', 'influencers', 'restock'].includes(dept.type)
      ));
    }).catch(() => {});
  }, [fetchGoals, fetchLiveData]);

  // Auto-calculate current_value for revenue/expense/task goals
  const goalsWithProgress = useMemo(() => {
    return goals.map(goal => {
      let autoValue = goal.current_value;

      if (goal.type === 'revenue') {
        const filtered = goal.department_id
          ? liveRevenue.filter(r => r.department_id === goal.department_id)
          : liveRevenue;
        const dateFiltered = filtered.filter(r => {
          if (goal.start_date && r.date && r.date < goal.start_date) return false;
          if (goal.end_date && r.date && r.date > goal.end_date) return false;
          return true;
        });
        autoValue = dateFiltered.reduce((s, r) => s + convertToUSD(Number(r.amount) || 0, r.currency, rates), 0);
      } else if (goal.type === 'expense') {
        const filtered = goal.department_id
          ? liveExpenses.filter(e => e.department_id === goal.department_id)
          : liveExpenses;
        const dateFiltered = filtered.filter(e => {
          if (goal.start_date && e.date && e.date < goal.start_date) return false;
          if (goal.end_date && e.date && e.date > goal.end_date) return false;
          return true;
        });
        autoValue = dateFiltered.reduce((s, e) => s + convertToUSD(Number(e.amount) || 0, e.currency, rates), 0);
      } else if (goal.type === 'task') {
        const filtered = goal.department_id
          ? liveTasks.filter(t => t.department_id === goal.department_id)
          : liveTasks;
        autoValue = filtered.filter(t => t.status === 'Done').length;
      }

      const pct = goal.target_value > 0 ? Math.min(Math.round((autoValue / goal.target_value) * 100), 100) : 0;
      return { ...goal, current_value: autoValue, pct };
    });
  }, [goals, liveRevenue, liveExpenses, liveTasks, rates]);

  const filteredGoals = filter === 'all' ? goalsWithProgress : goalsWithProgress.filter(g => g.status === filter);

  const counts = {
    all: goalsWithProgress.length,
    active: goalsWithProgress.filter(g => g.status === 'active').length,
    completed: goalsWithProgress.filter(g => g.status === 'completed').length,
    missed: goalsWithProgress.filter(g => g.status === 'missed').length,
  };

  const resetForm = () => {
    setFormTitle(''); setFormType('revenue'); setFormTarget(''); setFormCurrent('');
    setFormCurrency('USD'); setFormDeptId(departmentId || ''); setFormPeriod('monthly');
    setFormStartDate(format(new Date(), 'yyyy-MM-dd')); setFormEndDate('');
    setFormNotes(''); setFormError(''); setEditingId(null);
  };

  const openEdit = (goal: Goal & { pct: number }) => {
    setEditingId(goal.id);
    setFormTitle(goal.title);
    setFormType(goal.type);
    setFormTarget(String(goal.target_value));
    setFormCurrent(String(goal.current_value));
    setFormCurrency(goal.currency);
    setFormDeptId(goal.department_id || '');
    setFormPeriod(goal.period);
    setFormStartDate(goal.start_date || '');
    setFormEndDate(goal.end_date || '');
    setFormNotes(goal.notes);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) { setFormError('Title is required'); return; }
    if (!formTarget || Number(formTarget) <= 0) { setFormError('Target must be greater than 0'); return; }

    setSubmitting(true);
    setFormError('');

    const body = {
      title: formTitle.trim(),
      type: formType,
      target_value: Number(formTarget),
      current_value: formType === 'custom' ? Number(formCurrent) || 0 : 0,
      currency: formCurrency,
      department_id: formDeptId || null,
      period: formPeriod,
      start_date: formStartDate || null,
      end_date: formEndDate || null,
      status: 'active',
      notes: formNotes,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/goals/${editingId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to update goal');
      } else {
        const res = await fetch('/api/goals', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to create goal');
      }
      resetForm();
      setShowForm(false);
      await fetchGoals();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
  };

  const handleStatusChange = async (id: string, status: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, status: status as Goal['status'] } : g));
    await fetch(`/api/goals/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  };

  const handleUpdateCurrent = async (id: string, value: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current_value: value } : g));
    await fetch(`/api/goals/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_value: value }),
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {departmentId ? 'Department Goals' : 'Goals & Targets'}
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Set targets and track progress across your business</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm"
        >
          <Plus size={15} />
          New Goal
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          { key: 'all',       label: `All (${counts.all})` },
          { key: 'active',    label: `Active (${counts.active})` },
          { key: 'completed', label: `Completed (${counts.completed})` },
          { key: 'missed',    label: `Missed (${counts.missed})` },
        ] as { key: typeof filter; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              filter === f.key
                ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <Target size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm font-medium text-gray-400 mb-1">No goals yet</p>
          <p className="text-xs text-gray-300">Create a goal to start tracking your progress</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredGoals.map(goal => {
            const typeCfg = TYPE_CONFIG[goal.type] || TYPE_CONFIG.custom;
            const statusCfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.active;
            const isAutoTracked = goal.type !== 'custom';
            const pctColor = goal.pct >= 100 ? 'bg-emerald-500' : goal.pct >= 50 ? 'bg-blue-500' : goal.pct >= 25 ? 'bg-amber-500' : 'bg-gray-300';
            const deptName = goal.department_id
              ? departments.find(d => d.id === goal.department_id)?.name || goal.department_id
              : 'All Departments';

            return (
              <div key={goal.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {/* Top row: type badge + status + actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${typeCfg.bg}`}>
                      {typeCfg.icon}
                      {typeCfg.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.cls}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(goal)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{goal.title}</h3>
                <p className="text-xs text-gray-400 mb-4">{deptName} &middot; {goal.period}</p>

                {/* Progress */}
                <div className="mt-auto">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-xl font-bold text-gray-900 tabular-nums">
                        {goal.type === 'task'
                          ? goal.current_value
                          : formatDisplay(goal.current_value)
                        }
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        of {goal.type === 'task'
                          ? `${goal.target_value} tasks`
                          : formatDisplay(goal.target_value)
                        }
                      </p>
                    </div>
                    <span className={`text-lg font-bold tabular-nums ${
                      goal.pct >= 100 ? 'text-emerald-600' : goal.pct >= 50 ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {goal.pct}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${pctColor}`} style={{ width: `${goal.pct}%` }} />
                  </div>

                  {/* Date range */}
                  {(goal.start_date || goal.end_date) && (
                    <p className="text-[11px] text-gray-400 mt-2">
                      {goal.start_date && format(new Date(goal.start_date), 'MMM d, yyyy')}
                      {goal.start_date && goal.end_date && ' — '}
                      {goal.end_date && format(new Date(goal.end_date), 'MMM d, yyyy')}
                    </p>
                  )}

                  {/* Custom goal: manual update input */}
                  {!isAutoTracked && goal.status === 'active' && (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={goal.current_value}
                        onBlur={e => {
                          const v = Number(e.target.value);
                          if (!isNaN(v)) handleUpdateCurrent(goal.id, v);
                        }}
                        className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#3b82f6] outline-none"
                        placeholder="Progress"
                      />
                      <span className="text-[11px] text-gray-400">Update progress</span>
                    </div>
                  )}

                  {/* Auto-tracked badge */}
                  {isAutoTracked && (
                    <p className="text-[10px] text-blue-500 font-medium mt-2 flex items-center gap-1">
                      <AlertCircle size={10} />
                      Auto-tracked from {goal.type} data
                    </p>
                  )}

                  {/* Status actions */}
                  {goal.status === 'active' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleStatusChange(goal.id, 'completed')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-medium rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
                      >
                        <CheckCircle2 size={11} />
                        Mark Complete
                      </button>
                      <button
                        onClick={() => handleStatusChange(goal.id, 'missed')}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-500 text-[11px] font-medium rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        Mark Missed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Goal Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowForm(false); resetForm(); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{editingId ? 'Edit Goal' : 'Create New Goal'}</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Goal Title *</label>
                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Hit $50K monthly revenue" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" autoFocus />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
                  <div className="relative">
                    <select value={formType} onChange={e => setFormType(e.target.value as any)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white">
                      <option value="revenue">Revenue Target</option>
                      <option value="expense">Expense Budget</option>
                      <option value="task">Task Completion</option>
                      <option value="custom">Custom Milestone</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Period</label>
                  <div className="relative">
                    <select value={formPeriod} onChange={e => setFormPeriod(e.target.value as any)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white">
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom Range</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Target {formType === 'task' ? '(# of tasks)' : 'Amount'} *
                  </label>
                  <input type="number" value={formTarget} onChange={e => setFormTarget(e.target.value)} placeholder="0" min="0" step={formType === 'task' ? '1' : '0.01'} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
                </div>
                {formType === 'custom' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Current Progress</label>
                    <input type="number" value={formCurrent} onChange={e => setFormCurrent(e.target.value)} placeholder="0" min="0" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
                  </div>
                )}
                {formType !== 'custom' && formType !== 'task' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Currency</label>
                    <select value={formCurrency} onChange={e => setFormCurrency(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white">
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Department <span className="text-gray-300 font-normal normal-case">(optional — leave empty for all)</span>
                </label>
                <div className="relative">
                  <select value={formDeptId} onChange={e => setFormDeptId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none appearance-none bg-white">
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Date</label>
                  <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Additional context..." rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] outline-none resize-none" />
              </div>

              {formType !== 'custom' && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-600">
                  Progress for <strong>{formType}</strong> goals is automatically calculated from your {formType} data{formDeptId ? ' within the selected department' : ' across all departments'}.
                </div>
              )}

              {formError && (
                <div className="px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium">{formError}</div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={submitting} className="px-5 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm disabled:opacity-50">
                {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
