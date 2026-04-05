'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Cake, Check, Clock, Gift } from 'lucide-react';
import { toast } from 'sonner';

interface BirthdayNotification {
  id: string;
  name: string;
  birthday: string;
  days_until: number;
  is_today: boolean;
}

export default function BirthdayNotificationBanner() {
  const { profile, isSuperAdmin, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<BirthdayNotification[]>([]);
  const [dismissing, setDismissing] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/birthday-notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silently fail — not critical
    }
  }, []);

  useEffect(() => {
    if (!profile || (!isSuperAdmin && !isAdmin)) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile, isSuperAdmin, isAdmin, fetchNotifications]);

  const handleDismiss = async (partnerId: string, action: 'greeted' | 'snoozed') => {
    setDismissing(partnerId);
    try {
      const res = await fetch('/api/birthday-notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: partnerId, action }),
      });
      if (!res.ok) throw new Error();
      setNotifications(prev => prev.filter(n => n.id !== partnerId));
      if (action === 'greeted') {
        toast.success('Marked as greeted!');
      } else {
        toast('Reminder set for 90 minutes', { icon: '⏰' });
      }
    } catch {
      toast.error('Failed to dismiss notification');
    } finally {
      setDismissing(null);
    }
  };

  if (notifications.length === 0) return null;

  const todayBirthdays = notifications.filter(n => n.is_today);
  const upcomingBirthdays = notifications.filter(n => !n.is_today && n.days_until > 0);
  const recentBirthdays = notifications.filter(n => n.days_until < 0);

  const btnBaseCls = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-colors disabled:opacity-50';

  return (
    <div className="space-y-2.5 mb-5">
      {/* Today */}
      {todayBirthdays.map(n => (
        <div key={n.id} className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center shrink-0">
              <Cake size={18} className="text-pink-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-pink-900">It&apos;s {n.name}&apos;s birthday today!</p>
                <Gift size={13} className="text-pink-400" />
              </div>
              <p className="text-xs text-pink-600 mt-0.5">Don&apos;t forget to wish them well!</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => handleDismiss(n.id, 'greeted')} disabled={dismissing === n.id}
                className={`${btnBaseCls} bg-[#3b82f6] text-white hover:bg-[#2563eb]`}>
                <Check size={12} /> Greeted
              </button>
              <button onClick={() => handleDismiss(n.id, 'snoozed')} disabled={dismissing === n.id}
                className={`${btnBaseCls} bg-white border border-pink-200 text-pink-700 hover:bg-pink-50`}>
                <Clock size={12} /> Later
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Upcoming */}
      {upcomingBirthdays.map(n => (
        <div key={n.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Cake size={18} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900">
                {n.name}&apos;s birthday in {n.days_until} day{n.days_until !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">{formatBirthday(n.birthday)}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => handleDismiss(n.id, 'greeted')} disabled={dismissing === n.id}
                className={`${btnBaseCls} bg-[#3b82f6] text-white hover:bg-[#2563eb]`}>
                <Check size={12} /> Greeted
              </button>
              <button onClick={() => handleDismiss(n.id, 'snoozed')} disabled={dismissing === n.id}
                className={`${btnBaseCls} bg-white border border-amber-200 text-amber-700 hover:bg-amber-50/80`}>
                <Clock size={12} /> Later
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Recent */}
      {recentBirthdays.map(n => (
        <div key={n.id} className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Cake size={18} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900">
                {n.name}&apos;s birthday was {Math.abs(n.days_until)} day{Math.abs(n.days_until) !== 1 ? 's' : ''} ago
              </p>
              <p className="text-xs text-blue-600 mt-0.5">{formatBirthday(n.birthday)} — Not too late for a belated wish!</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => handleDismiss(n.id, 'greeted')} disabled={dismissing === n.id}
                className={`${btnBaseCls} bg-[#3b82f6] text-white hover:bg-[#2563eb]`}>
                <Check size={12} /> Greeted
              </button>
              <button onClick={() => handleDismiss(n.id, 'snoozed')} disabled={dismissing === n.id}
                className={`${btnBaseCls} bg-white border border-blue-200 text-blue-700 hover:bg-blue-50/80`}>
                <Clock size={12} /> Later
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatBirthday(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}
