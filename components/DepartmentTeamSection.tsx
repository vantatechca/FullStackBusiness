'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Crown, Star, ThumbsUp, ThumbsDown, Clock, Calendar, DollarSign, Briefcase, StickyNote, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRealtimeTable } from '@/lib/realtime';
import { useAuth } from '@/lib/auth-context';
import { DEPARTMENTS } from '@/lib/departments';
import type { DepartmentTeamMember } from '@/lib/types';
import { CURRENCIES } from '@/lib/types';

interface DepartmentTeamSectionProps {
  departmentId: string;
}

const ALL_PROJECTS = DEPARTMENTS.filter(d => d.id !== 'dashboard' && d.id !== 'admin').map(d => ({ id: d.id, name: d.name }));

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">{children}</span>;
}

interface MemberCardProps {
  member: DepartmentTeamMember;
  onUpdate: (id: string, key: string, value: string | number | boolean) => void;
  onDelete: (id: string) => void;
}

function MemberCard({ member, onUpdate, onDelete }: MemberCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedProjects = member.assigned_projects
    ? member.assigned_projects.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  function toggleProject(projectId: string) {
    const updated = selectedProjects.includes(projectId)
      ? selectedProjects.filter(p => p !== projectId)
      : [...selectedProjects, projectId];
    onUpdate(member.id, 'assigned_projects', updated.join(','));
  }

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 ${member.in_charge ? 'border-amber-300 shadow-amber-50 shadow-md' : 'border-gray-200 shadow-sm'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${member.in_charge ? 'bg-amber-100' : 'bg-blue-50'}`}>
            {member.in_charge ? <Crown size={18} className="text-amber-500" /> : <User size={18} className="text-blue-400" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <input
                type="text"
                value={member.name}
                onChange={e => onUpdate(member.id, 'name', e.target.value)}
                placeholder="Name"
                className="text-base font-semibold text-gray-900 bg-transparent border-0 outline-none focus:ring-0 p-0 w-full placeholder-gray-300"
              />
              {member.in_charge && (
                <span className="flex-shrink-0 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">IN CHARGE</span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <div
                  onClick={() => onUpdate(member.id, 'in_charge', !member.in_charge)}
                  className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${member.in_charge ? 'bg-amber-400' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${member.in_charge ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-[11px] text-gray-500">Lead</span>
              </label>

              <div className="flex items-center gap-1">
                <span className="text-[11px] text-gray-400">Reports to:</span>
                <input
                  type="text"
                  value={member.reports_to}
                  onChange={e => onUpdate(member.id, 'reports_to', e.target.value)}
                  placeholder="—"
                  className="text-[12px] text-gray-600 bg-transparent border-0 outline-none focus:ring-0 p-0 w-24 placeholder-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDelete(member.id)}
                  className="text-[11px] font-medium text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[11px] font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <FieldLabel><Clock size={10} className="inline mr-1" />Hrs/Day</FieldLabel>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={member.hours_per_day}
              onChange={e => onUpdate(member.id, 'hours_per_day', parseFloat(e.target.value) || 0)}
              className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
          <div>
            <FieldLabel><Calendar size={10} className="inline mr-1" />Days/Week</FieldLabel>
            <input
              type="number"
              step="0.5"
              min="0"
              max="7"
              value={member.days_per_week}
              onChange={e => onUpdate(member.id, 'days_per_week', parseFloat(e.target.value) || 0)}
              className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
          <div>
            <FieldLabel><DollarSign size={10} className="inline mr-1" />Salary</FieldLabel>
            <input
              type="number"
              step="any"
              min="0"
              value={member.salary}
              onChange={e => onUpdate(member.id, 'salary', parseFloat(e.target.value) || 0)}
              className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            />
          </div>
          <div>
            <FieldLabel>Currency</FieldLabel>
            <select
              value={member.salary_currency}
              onChange={e => onUpdate(member.id, 'salary_currency', e.target.value)}
              className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <FieldLabel><Star size={10} className="inline mr-1" />Main Skills</FieldLabel>
          <input
            type="text"
            value={member.main_skills}
            onChange={e => onUpdate(member.id, 'main_skills', e.target.value)}
            placeholder="e.g. SEO, Copywriting, Data Analysis"
            className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
          />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel><ThumbsUp size={10} className="inline mr-1 text-green-500" />Tasks They Love</FieldLabel>
              <textarea
                value={member.tasks_love}
                onChange={e => onUpdate(member.id, 'tasks_love', e.target.value)}
                placeholder="Describe tasks they enjoy..."
                rows={3}
                className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none"
              />
            </div>
            <div>
              <FieldLabel><ThumbsDown size={10} className="inline mr-1 text-red-400" />Tasks They Dislike</FieldLabel>
              <textarea
                value={member.tasks_hate}
                onChange={e => onUpdate(member.id, 'tasks_hate', e.target.value)}
                placeholder="Describe tasks they dislike..."
                rows={3}
                className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <FieldLabel>Bonus Structure</FieldLabel>
              <div
                onClick={() => onUpdate(member.id, 'bonus_structure', !member.bonus_structure)}
                className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${member.bonus_structure ? 'bg-green-400' : 'bg-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${member.bonus_structure ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              {member.bonus_structure && <span className="text-[11px] text-green-600 font-medium">Eligible</span>}
            </div>
            {member.bonus_structure && (
              <textarea
                value={member.bonus_details}
                onChange={e => onUpdate(member.id, 'bonus_details', e.target.value)}
                placeholder="Describe the bonus structure, conditions, amounts..."
                rows={2}
                className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none"
              />
            )}
          </div>

          <div>
            <FieldLabel><Briefcase size={10} className="inline mr-1" />Assigned Projects</FieldLabel>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {ALL_PROJECTS.map(project => {
                const active = selectedProjects.includes(project.id);
                return (
                  <button
                    key={project.id}
                    onClick={() => toggleProject(project.id)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all ${
                      active
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-500'
                    }`}
                  >
                    {project.name}
                  </button>
                );
              })}
            </div>
            {selectedProjects.length > 0 && (
              <p className="mt-1.5 text-[11px] text-gray-400">
                {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} assigned
              </p>
            )}
          </div>

          <div>
            <FieldLabel><StickyNote size={10} className="inline mr-1" />Notes</FieldLabel>
            <textarea
              value={member.notes}
              onChange={e => onUpdate(member.id, 'notes', e.target.value)}
              placeholder="Additional notes about this person..."
              rows={2}
              className="mt-0.5 w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function DepartmentTeamSection({ departmentId }: DepartmentTeamSectionProps) {
  const { user } = useAuth();
  const { data, loading } = useRealtimeTable<DepartmentTeamMember>('department_team_members', { column: 'department_id', value: departmentId });

  const sorted = [...data].sort((a, b) => {
    if (a.in_charge && !b.in_charge) return -1;
    if (!a.in_charge && b.in_charge) return 1;
    return a.sort_order - b.sort_order;
  });

  const handleAdd = useCallback(async () => {
    await supabase.from('department_team_members').insert({
      department_id: departmentId,
      name: '',
      in_charge: false,
      reports_to: '',
      hours_per_day: 8,
      days_per_week: 5,
      main_skills: '',
      tasks_love: '',
      tasks_hate: '',
      salary: 0,
      salary_currency: 'USD',
      bonus_structure: false,
      bonus_details: '',
      assigned_projects: '',
      notes: '',
      sort_order: data.length,
      created_by: user?.id ?? null,
    });
  }, [departmentId, data.length, user?.id]);

  const handleUpdate = useCallback(async (id: string, key: string, value: string | number | boolean) => {
    await supabase.from('department_team_members').update({ [key]: value }).eq('id', id);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('department_team_members').delete().eq('id', id);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">Team for this department</h3>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {sorted.length} member{sorted.length !== 1 ? 's' : ''} — expand a card to see full details
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors"
        >
          <Plus size={14} />
          Add Member
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-xl">
          <User size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm mb-4">No team members yet for this department.</p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors"
          >
            <Plus size={14} />
            Add First Member
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
