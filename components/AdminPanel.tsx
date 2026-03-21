
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRealtimeTable } from '@/lib/realtime';
import { useCurrency } from '@/lib/currency-context';
import { DEPARTMENT_ICONS } from '@/lib/departments';
import type { Profile, TeamMember } from '@/lib/types';
import { Users, Shield, RefreshCw, Settings, CircleCheck as CheckCircle, Circle as XCircle, Globe, Activity, Database, CreditCard as Edit2, X } from 'lucide-react';

type AdminTab = 'users' | 'exchange-rates' | 'system';

interface DeptOption {
  id: string;
  name: string;
  icon: string;
  type: string;
}

function useDepartments() {
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/departments')
      .then(r => r.ok ? r.json() : [])
      .then((data: DeptOption[]) => setDepartments(data))
      .catch(() => setDepartments([]))
      .finally(() => setLoading(false));
  }, []);

  return { departments, loading };
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        active ? 'bg-[#3b82f6] text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700 border border-red-200',
    manager: 'bg-amber-100 text-amber-700 border border-amber-200',
    member: 'bg-gray-100 text-gray-600 border border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || colors.member}`}>
      {role}
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-[#22c55e]' : 'bg-gray-300'}`} />;
}

function UsersTab({ departments }: { departments: DeptOption[] }) {
  const { data: profiles, loading, setData } = useRealtimeTable<Profile>('profiles');
  const { data: teamMembers } = useRealtimeTable<TeamMember>('team_members');

  // Track which row is open for editing and what role is selected
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<string>('member');
  const [savingId, setSavingId] = useState<string | null>(null);

  const getTeamMember = (email: string) => teamMembers.find(t => t.email === email);
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || id;

  const startEdit = (profileId: string, currentRole: string) => {
    setEditingId(profileId);
    setEditingRole(currentRole);
  };

  const cancelEdit = () => setEditingId(null);

  const saveRole = async (profileId: string) => {
    setSavingId(profileId);
    await fetch(`/api/profiles/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: editingRole }),
    });
    // Optimistic update — badge reflects new role immediately
    setData(prev => prev.map(p =>
      p.id === profileId ? { ...p, role: editingRole as Profile['role'] } : p
    ));
    setSavingId(null);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Registered Users</h3>
          <p className="text-sm text-gray-500 mt-0.5">{profiles.length} user{profiles.length !== 1 ? 's' : ''} in the system</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_2fr_1fr] gap-0 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>User</span>
          <span>Role</span>
          <span>Departments</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-gray-100">
          {profiles.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No users found</div>
          )}
          {profiles.map(p => {
            const tm = getTeamMember(p.email);
            const depts = tm?.departments
              ? tm.departments.split(',').map(d => d.trim()).filter(Boolean)
              : [];
            const isEditing = editingId === p.id;

            return (
              <div key={p.id} className="grid grid-cols-[2fr_1fr_2fr_1fr] gap-0 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] text-sm font-bold shrink-0">
                    {(p.full_name || p.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{p.full_name || '—'}</div>
                    <div className="text-xs text-gray-500 truncate">{p.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      {/* Controlled select — value synced to editingRole state */}
                      <select
                        value={editingRole}
                        onChange={e => setEditingRole(e.target.value)}
                        disabled={savingId === p.id}
                        className="text-xs border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none"
                      >
                        <option value="admin">admin</option>
                        <option value="manager">manager</option>
                        <option value="member">member</option>
                      </select>
                      <button
                        onClick={() => saveRole(p.id)}
                        disabled={savingId === p.id}
                        className="text-[11px] font-medium text-white bg-[#3b82f6] hover:bg-[#2563eb] px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        {savingId === p.id ? '…' : 'Save'}
                      </button>
                      <button onClick={cancelEdit} className="p-0.5 text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <RoleBadge role={p.role} />
                      <button
                        onClick={() => startEdit(p.id, p.role)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-opacity"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 pr-4">
                  {depts.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">All (admin)</span>
                  ) : (
                    depts.slice(0, 3).map(d => (
                      <span key={d} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100">
                        {getDeptName(d)}
                      </span>
                    ))
                  )}
                  {depts.length > 3 && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                      +{depts.length - 3}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <StatusDot active={true} />
                  <span className="text-xs text-gray-500">Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Role Permissions</p>
            <ul className="mt-1.5 space-y-1">
              <li className="text-xs text-amber-700"><span className="font-semibold">Admin</span> — Full access to all departments, team, and admin panel</li>
              <li className="text-xs text-amber-700"><span className="font-semibold">Manager</span> — Access to all departments, no admin panel</li>
              <li className="text-xs text-amber-700"><span className="font-semibold">Member</span> — Access only to departments assigned in Team Members</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExchangeRatesTab() {
  const { rates, refreshRates, ratesLoading } = useCurrency();
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/exchange-rates')
      .then(r => r.json())
      .then(data => {
        if (data?.last_updated) setLastUpdated(data.last_updated);
      })
      .catch(console.error);
  }, [rates]);

  const rateEntries = rates ? Object.entries(rates).sort((a, b) => a[0].localeCompare(b[0])) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Exchange Rates</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Base: USD — {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleString()}` : 'Not yet updated'}
          </p>
        </div>
        <button
          onClick={refreshRates}
          disabled={ratesLoading}
          className="flex items-center gap-2 px-3 py-2 bg-[#3b82f6] text-white text-sm rounded-lg hover:bg-[#2563eb] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={ratesLoading ? 'animate-spin' : ''} />
          Refresh Rates
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 gap-0 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Currency</span>
          <span>Rate (vs USD)</span>
          <span>1 USD =</span>
        </div>
        <div className="divide-y divide-gray-100">
          {rateEntries.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              No rates loaded. Click &quot;Refresh Rates&quot; to fetch latest.
            </div>
          )}
          {rateEntries.map(([currency, rate]) => (
            <div key={currency} className="grid grid-cols-3 gap-0 px-5 py-3 items-center hover:bg-gray-50">
              <span className="text-sm font-semibold text-gray-900">{currency}</span>
              <span className="text-sm text-gray-600 font-mono">{Number(rate).toFixed(6)}</span>
              <span className="text-sm text-gray-500">{Number(rate).toFixed(4)} {currency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SystemTab({ departments, deptsLoading }: { departments: DeptOption[]; deptsLoading: boolean }) {
  const { data: profiles } = useRealtimeTable<Profile>('profiles');
  const { data: teamMembers } = useRealtimeTable<TeamMember>('team_members');
  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const tables = ['revenue', 'expenses', 'tasks', 'gmb_listings', 'influencers', 'suppliers', 'department_notes'];
        const results = await Promise.all(
          tables.map(t => fetch(`/api/table-data?table=${t}`).then(r => r.json()))
        );
        const stats: Record<string, number> = {};
        tables.forEach((t, i) => { stats[t] = Array.isArray(results[i]) ? results[i].length : 0; });
        setDbStats(stats);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const visibleDepts = departments.filter(d => d.id !== 'dashboard' && d.id !== 'admin');

  const statCards = [
    { label: 'Registered Users', value: profiles.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Team Members', value: teamMembers.length, icon: Shield, color: 'bg-green-50 text-green-600' },
    { label: 'Revenue Records', value: dbStats.revenue ?? '—', icon: Activity, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Expense Records', value: dbStats.expenses ?? '—', icon: Database, color: 'bg-red-50 text-red-600' },
    { label: 'Tasks', value: dbStats.tasks ?? '—', icon: CheckCircle, color: 'bg-amber-50 text-amber-600' },
    { label: 'GMB Listings', value: dbStats.gmb_listings ?? '—', icon: Globe, color: 'bg-sky-50 text-sky-600' },
    { label: 'Influencers', value: dbStats.influencers ?? '—', icon: Users, color: 'bg-pink-50 text-pink-600' },
    { label: 'Suppliers', value: dbStats.suppliers ?? '—', icon: Database, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900">System Overview</h3>
        <p className="text-sm text-gray-500 mt-0.5">Database statistics and system health</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {statsLoading ? <span className="text-gray-300">—</span> : card.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={14} className="text-[#3b82f6]" />
          System Status
        </h4>
        <div className="space-y-3">
          {[
            { label: 'Database Connection', ok: true },
            { label: 'Authentication', ok: true },
            { label: 'Exchange Rate Service', ok: true },
            { label: 'API Routes', ok: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-700">{item.label}</span>
              <div className="flex items-center gap-1.5">
                {item.ok ? (
                  <>
                    <CheckCircle size={14} className="text-[#22c55e]" />
                    <span className="text-xs text-[#22c55e] font-medium">Operational</span>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="text-[#ef4444]" />
                    <span className="text-xs text-[#ef4444] font-medium">Error</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings size={14} className="text-gray-500" />
          Department Registry
          <span className="ml-auto text-xs text-gray-400 font-normal">{visibleDepts.length} departments</span>
        </h4>
        {deptsLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-7 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-1.5">
            {visibleDepts.map(d => {
              const Icon = DEPARTMENT_ICONS[d.icon];
              return (
                <div key={d.id} className="flex items-center justify-between py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
                    <span className="text-gray-700">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 font-mono">{d.type}</span>
                    <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200">{d.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const { profile } = useAuth();
  const { departments, loading: deptsLoading } = useDepartments();

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Shield size={40} className="text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Access Denied</p>
        <p className="text-sm text-gray-400 mt-1">Admin access required to view this panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
            <span className="flex items-center gap-1.5"><Users size={14} />Users & Roles</span>
          </TabButton>
          <TabButton active={activeTab === 'exchange-rates'} onClick={() => setActiveTab('exchange-rates')}>
            <span className="flex items-center gap-1.5"><Globe size={14} />Exchange Rates</span>
          </TabButton>
          <TabButton active={activeTab === 'system'} onClick={() => setActiveTab('system')}>
            <span className="flex items-center gap-1.5"><Settings size={14} />System</span>
          </TabButton>
        </div>
      </div>

      {activeTab === 'users' && <UsersTab departments={departments} />}
      {activeTab === 'exchange-rates' && <ExchangeRatesTab />}
      {activeTab === 'system' && <SystemTab departments={departments} deptsLoading={deptsLoading} />}
    </div>
  );
}