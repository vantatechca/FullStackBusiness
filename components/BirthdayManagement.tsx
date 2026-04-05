'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Plus, Pencil, Trash2, Cake, Search, Star, StarOff,
  Loader2, User, Calendar,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  Modal, ConfirmDialog, FormField, EmptyState,
  inputCls, textareaCls, btnPrimaryCls, btnSecondaryCls, btnGhostCls, cardCls, errorBoxCls,
} from '@/components/ui/shared';
import type { BusinessPartner, Profile } from '@/lib/types';

function formatBirthday(dateStr: string | null): string {
  if (!dateStr) return 'Not set';
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function getDaysUntil(birthday: string): { days: number; isToday: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bday = new Date(birthday + 'T00:00:00Z');
  const thisYear = new Date(today.getFullYear(), bday.getUTCMonth(), bday.getUTCDate());
  const diffMs = thisYear.getTime() - today.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days < -7) {
    // Next year's birthday
    const nextYear = new Date(today.getFullYear() + 1, bday.getUTCMonth(), bday.getUTCDate());
    return { days: Math.round((nextYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), isToday: false };
  }
  return { days, isToday: days === 0 };
}

// ─── Partner Form Modal ───────────────────────────────────────────────────

function PartnerFormModal({
  open, onClose, partner, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  partner: BusinessPartner | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName(partner?.name || '');
      setBirthday(partner?.birthday ? partner.birthday.split('T')[0] : '');
      setNotes(partner?.notes || '');
      setError('');
    }
  }, [open, partner]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const body = { name: name.trim(), birthday: birthday || null, notes: notes.trim() };
      const res = partner
        ? await fetch(`/api/business-partners/${partner.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/business-partners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }
      toast.success(partner ? 'Partner updated' : 'Partner added');
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={partner ? 'Edit Person' : 'Add Person'}
      description="Manage birthday and contact details"
      size="sm"
      footer={
        <>
          <button onClick={onClose} className={btnSecondaryCls} disabled={saving}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className={btnPrimaryCls}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {partner ? 'Save Changes' : 'Add Person'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className={errorBoxCls}>{error}</div>}

        <FormField label="Full Name" required>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Dana"
            className={inputCls}
            autoFocus
          />
        </FormField>

        <FormField label="Birthday" hint="month and day are used for notifications">
          <input
            type="date"
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
            className={inputCls}
          />
        </FormField>

        <FormField label="Notes" hint="optional">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any notes about this person..."
            rows={3}
            className={textareaCls}
          />
        </FormField>
      </div>
    </Modal>
  );
}

// ─── Starred Admins Management ────────────────────────────────────────────

function StarredAdminsSection() {
  const [admins, setAdmins] = useState<Profile[]>([]);
  const [starred, setStarred] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [adminsRes, starredRes] = await Promise.all([
        fetch('/api/table-data?table=profiles'),
        fetch('/api/birthday-starred-admins'),
      ]);
      const adminsData = await adminsRes.json();
      const starredData = await starredRes.json();

      setAdmins((adminsData || []).filter((p: Profile) => p.role === 'admin' || p.role === 'super_admin'));
      setStarred((starredData || []).map((s: any) => s.admin_id));
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleStar = async (adminId: string) => {
    const isStarred = starred.includes(adminId);
    try {
      if (isStarred) {
        await fetch(`/api/birthday-starred-admins/${adminId}`, { method: 'DELETE' });
        setStarred(prev => prev.filter(id => id !== adminId));
        toast.success('Admin unstarred');
      } else {
        await fetch('/api/birthday-starred-admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_id: adminId }),
        });
        setStarred(prev => [...prev, adminId]);
        toast.success('Admin starred — they will now see birthday notifications');
      }
    } catch {
      toast.error('Failed to update');
    }
  };

  if (loading) return <div className="h-20 bg-gray-100 rounded-xl animate-pulse" />;

  return (
    <div className={cardCls + ' overflow-hidden'}>
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Starred Admins</h3>
        <p className="text-xs text-gray-500 mt-0.5">Starred admins will see birthday notifications on their dashboard</p>
      </div>
      <div className="divide-y divide-gray-100">
        {admins.map(admin => {
          const isStarred = starred.includes(admin.id);
          return (
            <div key={admin.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User size={14} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{admin.full_name}</p>
                <p className="text-xs text-gray-400">{admin.email}</p>
              </div>
              <button
                onClick={() => toggleStar(admin.id)}
                className={`p-2 rounded-lg transition-colors ${
                  isStarred
                    ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                }`}
                title={isStarred ? 'Unstar' : 'Star for birthday notifications'}
              >
                {isStarred ? <Star size={16} className="fill-current" /> : <StarOff size={16} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function BirthdayManagement() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<BusinessPartner | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/business-partners');
      if (res.ok) {
        const data = await res.json();
        setPartners(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const filtered = useMemo(() => {
    if (!search) return partners;
    const q = search.toLowerCase();
    return partners.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
  }, [partners, search]);

  // Sort: upcoming birthdays first, then by name
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.birthday && b.birthday) {
        const dA = getDaysUntil(a.birthday).days;
        const dB = getDaysUntil(b.birthday).days;
        return dA - dB;
      }
      if (a.birthday && !b.birthday) return -1;
      if (!a.birthday && b.birthday) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filtered]);

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await fetch(`/api/business-partners/${deletingId}`, { method: 'DELETE' });
      setPartners(prev => prev.filter(p => p.id !== deletingId));
      toast.success('Person removed');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setDeletingId(null);
    }
  };

  const openEdit = (partner: BusinessPartner) => {
    setEditingPartner(partner);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditingPartner(null);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Birthdays</h2>
          <p className="text-sm text-gray-500">{partners.length} people tracked</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className={btnPrimaryCls}>
            <Plus size={15} /> Add Person
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name..."
          className={`${inputCls} pl-9`}
        />
      </div>

      {/* Partner List */}
      {sorted.length === 0 ? (
        <EmptyState
          icon={<Cake size={32} />}
          title="No people found"
          description={search ? 'Try a different search term' : 'Add people to track their birthdays'}
          action={isAdmin ? (
            <button onClick={openCreate} className={btnPrimaryCls}>
              <Plus size={15} /> Add Person
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {sorted.map(partner => {
            const bday = partner.birthday ? getDaysUntil(partner.birthday) : null;
            return (
              <div key={partner.id} className={`${cardCls} p-4 flex items-start gap-3 group hover:shadow-md transition-shadow`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  bday?.isToday ? 'bg-pink-100' :
                  bday && bday.days <= 7 && bday.days > 0 ? 'bg-amber-100' :
                  'bg-gray-100'
                }`}>
                  <Cake size={18} className={
                    bday?.isToday ? 'text-pink-500' :
                    bday && bday.days <= 7 && bday.days > 0 ? 'text-amber-500' :
                    'text-gray-400'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{partner.name}</p>
                  {partner.birthday ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Calendar size={11} className="text-gray-400" />
                      <span className="text-xs text-gray-500">{formatBirthday(partner.birthday)}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-0.5">No birthday set</p>
                  )}
                  {bday && (
                    <p className={`text-xs font-medium mt-1 ${
                      bday.isToday ? 'text-pink-600' :
                      bday.days <= 7 ? 'text-amber-600' :
                      'text-gray-400'
                    }`}>
                      {bday.isToday ? 'Today!' :
                       bday.days === 1 ? 'Tomorrow' :
                       bday.days < 0 ? `${Math.abs(bday.days)} days ago` :
                       `In ${bday.days} days`}
                    </p>
                  )}
                  {partner.notes && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{partner.notes}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEdit(partner)} className={btnGhostCls} title="Edit">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeletingId(partner.id)}
                      className="inline-flex items-center justify-center p-1.5 text-xs text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Starred Admins Section (super_admin only) */}
      {isSuperAdmin && (
        <div className="pt-4 border-t border-gray-200">
          <StarredAdminsSection />
        </div>
      )}

      {/* Form Modal */}
      <PartnerFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingPartner(null); }}
        partner={editingPartner}
        onSaved={fetchPartners}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Remove Person"
        message="This will permanently remove this person and their birthday data. This cannot be undone."
        confirmLabel="Remove"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
