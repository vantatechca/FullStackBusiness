
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import type { Profile } from '@/lib/types';
import {
  Users, Shield, Plus, Pencil, Trash2, X, Check, Eye, EyeOff,
  Loader as Loader2, Search, Activity, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

type AdminTab = 'users' | 'system-logs';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  ip_address: string;
  created_at: string;
}

// ─── Role Badge ─────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700 border border-purple-200',
    admin: 'bg-red-100 text-red-700 border border-red-200',
    manager: 'bg-amber-100 text-amber-700 border border-amber-200',
    member: 'bg-gray-100 text-gray-600 border border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] || colors.member}`}>
      {role.replace('_', ' ')}
    </span>
  );
}

// ─── Create User Modal ──────────────────────────────────────────────────────
function CreateUserModal({
  open, onClose, onCreated, isSuperAdmin,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (user: Profile) => void;
  isSuperAdmin: boolean;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setFullName(''); setEmail(''); setPassword(''); setRole('member');
    setShowPass(false); setError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, role, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create user'); setSaving(false); return; }
      toast.success(`User "${fullName}" created`);
      onCreated(data);
      handleClose();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
          <button onClick={handleClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none" placeholder="user@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none" placeholder="Min. 6 characters" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none">
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              {isSuperAdmin && <option value="admin">Admin</option>}
              {isSuperAdmin && <option value="super_admin">Super Admin</option>}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors disabled:opacity-60 flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit User Modal ────────────────────────────────────────────────────────
function EditUserModal({
  open, user, onClose, onUpdated, isSuperAdmin, currentUserId,
}: {
  open: boolean;
  user: Profile | null;
  onClose: () => void;
  onUpdated: (user: Profile) => void;
  isSuperAdmin: boolean;
  currentUserId: string;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
      setRole(user.role);
      setPassword('');
      setShowPass(false);
      setError('');
    }
  }, [user]);

  const handleClose = () => { setError(''); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setSaving(true);

    const body: Record<string, string> = {};
    if (fullName !== user.full_name) body.full_name = fullName;
    if (email !== user.email) body.email = email;
    if (role !== user.role) body.role = role;
    if (password) body.password = password;

    if (Object.keys(body).length === 0) { handleClose(); return; }

    try {
      const res = await fetch(`/api/profiles/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to update user'); setSaving(false); return; }
      toast.success(`User "${data.full_name}" updated`);
      onUpdated(data);
      handleClose();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !user) return null;

  const isSelf = user.id === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
          <button onClick={handleClose} className="p-1 rounded-md hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} minLength={6}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none" placeholder="Min. 6 characters" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} disabled={isSelf}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none disabled:bg-gray-50 disabled:text-gray-400">
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              {isSuperAdmin && <option value="admin">Admin</option>}
              {isSuperAdmin && <option value="super_admin">Super Admin</option>}
            </select>
            {isSelf && <p className="text-xs text-gray-400 mt-1">You cannot change your own role.</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors disabled:opacity-60 flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Users Tab ──────────────────────────────────────────────────────────────
function UsersTab({ isSuperAdmin, currentUserId }: { isSuperAdmin: boolean; currentUserId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch('/api/profiles');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : [data]);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const handleDelete = async (p: Profile) => {
    if (!confirm(`Delete user "${p.full_name || p.email}"? This cannot be undone.`)) return;
    setDeletingId(p.id);
    try {
      const res = await fetch(`/api/profiles/${p.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete user');
        return;
      }
      setProfiles(prev => prev.filter(u => u.id !== p.id));
      toast.success(`User "${p.full_name || p.email}" deleted`);
    } catch {
      toast.error('Network error');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = profiles.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.full_name?.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.role.includes(q);
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">User Management</h3>
          <p className="text-sm text-gray-500 mt-0.5">{profiles.length} user{profiles.length !== 1 ? 's' : ''} in the system</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors">
          <Plus size={14} /> Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or role..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#3b82f6] focus:border-[#3b82f6] outline-none" />
      </div>

      {/* User Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>User</span>
          <span>Role</span>
          <span>Created</span>
          <span>Actions</span>
        </div>
        <div className="divide-y divide-gray-100">
          {filtered.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">
              {search ? 'No users match your search' : 'No users found'}
            </div>
          )}
          {filtered.map(p => {
            const isSelf = p.id === currentUserId;
            const isTargetAdmin = p.role === 'admin' || p.role === 'super_admin';
            const canModify = isSuperAdmin || !isTargetAdmin;

            return (
              <div key={p.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6] text-sm font-bold shrink-0">
                    {(p.full_name || p.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{p.full_name || '—'}</div>
                    <div className="text-xs text-gray-500 truncate">{p.email}</div>
                  </div>
                </div>
                <div><RoleBadge role={p.role} /></div>
                <div className="text-xs text-gray-500">
                  {new Date(p.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  {canModify && (
                    <button onClick={() => setEditUser(p)} title="Edit user"
                      className="p-1.5 rounded-md text-gray-400 hover:text-[#3b82f6] hover:bg-blue-50 transition-colors">
                      <Pencil size={14} />
                    </button>
                  )}
                  {canModify && !isSelf && (
                    <button onClick={() => handleDelete(p)} disabled={deletingId === p.id} title="Delete user"
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                      <Trash2 size={14} />
                    </button>
                  )}
                  {isSelf && <span className="text-xs text-gray-400 italic">you</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role Permissions Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Role Permissions</p>
            <ul className="mt-1.5 space-y-1">
              <li className="text-xs text-amber-700"><span className="font-semibold">Super Admin</span> — Full access + system logs + can manage all roles</li>
              <li className="text-xs text-amber-700"><span className="font-semibold">Admin</span> — Full access to all departments + admin panel + can create members/managers</li>
              <li className="text-xs text-amber-700"><span className="font-semibold">Manager</span> — Access to assigned departments, can create/edit data</li>
              <li className="text-xs text-amber-700"><span className="font-semibold">Member</span> — Access only to assigned departments</li>
            </ul>
          </div>
        </div>
      </div>

      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)}
        onCreated={(u) => setProfiles(prev => [...prev, u])} isSuperAdmin={isSuperAdmin} />
      <EditUserModal open={!!editUser} user={editUser} onClose={() => setEditUser(null)}
        onUpdated={(u) => setProfiles(prev => prev.map(p => p.id === u.id ? u : p))} isSuperAdmin={isSuperAdmin} currentUserId={currentUserId} />
    </div>
  );
}

// ─── System Logs Tab (super_admin only) ─────────────────────────────────────
function SystemLogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const PAGE_SIZE = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entity_type', entityFilter);
      const res = await fetch(`/api/audit-logs?${params}`);
      if (!res.ok) throw new Error();
      setLogs(await res.json());
    } catch {
      toast.error('Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const actionColor = (action: string) => {
    if (action === 'create' || action === 'login') return 'bg-emerald-100 text-emerald-700';
    if (action === 'update') return 'bg-blue-100 text-blue-700';
    if (action === 'delete' || action === 'login_failed') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">System Logs</h3>
        <p className="text-sm text-gray-500 mt-0.5">Audit trail of all system actions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#3b82f6] outline-none">
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="login_failed">Login Failed</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#3b82f6] outline-none">
          <option value="">All Entities</option>
          <option value="user">User</option>
          <option value="session">Session</option>
          <option value="revenue">Revenue</option>
          <option value="expense">Expense</option>
          <option value="task">Task</option>
          <option value="department">Department</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_100px_2fr_140px] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>User</span>
          <span>Action</span>
          <span>Entity</span>
          <span>Details</span>
          <span>Time</span>
        </div>
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="px-5 py-8 text-center">
              <Loader2 size={20} className="animate-spin text-gray-400 mx-auto" />
            </div>
          ) : logs.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">No logs found</div>
          ) : logs.map(log => (
            <div key={log.id} className="grid grid-cols-[1fr_100px_100px_2fr_140px] gap-4 px-5 py-3 items-center text-sm hover:bg-gray-50">
              <div className="truncate text-gray-700">{log.user_email || '—'}</div>
              <div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${actionColor(log.action)}`}>
                  {log.action}
                </span>
              </div>
              <div className="text-gray-500 text-xs">{log.entity_type || '—'}</div>
              <div className="text-xs text-gray-500 truncate font-mono">
                {log.details && Object.keys(log.details).length > 0
                  ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ')
                  : '—'}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(log.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Page {page + 1}</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
            <ChevronLeft size={12} /> Previous
          </button>
          <button onClick={() => setPage(p => p + 1)} disabled={logs.length < PAGE_SIZE}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">
            Next <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Panel ───────────────────────────────────────────────────────
export default function AdminPanel() {
  const { isSuperAdmin, isAdmin, profile, loading } = useAuth();
  const [tab, setTab] = useState<AdminTab>('users');

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <Shield size={40} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">You do not have access to the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
        <p className="text-sm text-gray-500 mt-1">Manage users{isSuperAdmin ? ' and view system logs' : ''}</p>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}>
          <Users size={15} /> Users
        </button>
        {isSuperAdmin && (
          <button onClick={() => setTab('system-logs')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === 'system-logs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}>
            <Activity size={15} /> System Logs
          </button>
        )}
      </div>

      {/* Tab Content */}
      {tab === 'users' && <UsersTab isSuperAdmin={isSuperAdmin} currentUserId={profile?.id || ''} />}
      {tab === 'system-logs' && isSuperAdmin && <SystemLogsTab />}
    </div>
  );
}
