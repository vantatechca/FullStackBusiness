'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Cake, Check, Clock, Gift, X } from 'lucide-react';
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
  const [visible, setVisible] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/birthday-notifications');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (!profile || (!isSuperAdmin && !isAdmin)) return;
    fetchNotifications();

    // Re-check every 5 minutes for snoozed notifications that become due
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

      if (action === 'greeted') {
        setNotifications(prev => prev.filter(n => n.id !== partnerId));
        toast.success('Marked as greeted!');
      } else {
        setNotifications(prev => prev.filter(n => n.id !== partnerId));
        toast('Reminder set for 90 minutes from now', { icon: <Clock size={16} /> });
      }
    } catch {
      toast.error('Failed to dismiss notification');
    } finally {
      setDismissing(null);
    }
  };

  if (notifications.length === 0 || !visible) return null;

  const todayBirthdays = notifications.filter(n => n.is_today);
  const upcomingBirthdays = notifications.filter(n => !n.is_today && n.days_until > 0);
  const recentBirthdays = notifications.filter(n => n.days_until < 0);

  return (
    <div className="space-y-3 mb-6">
      {/* Today's Birthdays - prominent */}
      {todayBirthdays.map(n => (
        <div
          key={n.id}
          className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center shrink-0">
              <Cake size={20} className="text-pink-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-pink-900">
                  It&apos;s {n.name}&apos;s birthday today!
                </h4>
                <Gift size={14} className="text-pink-400" />
              </div>
              <p className="text-xs text-pink-600 mt-0.5">
                Don&apos;t forget to wish them a happy birthday and maybe send a gift!
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleDismiss(n.id, 'greeted')}
                disabled={dismissing === n.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <Check size={12} />
                Already Greeted
              </button>
              <button
                onClick={() => handleDismiss(n.id, 'snoozed')}
                disabled={dismissing === n.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-pink-200 text-pink-700 text-xs font-medium rounded-lg hover:bg-pink-50 transition-colors disabled:opacity-50"
              >
                <Clock size={12} />
                Remind Later
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Upcoming Birthdays */}
      {upcomingBirthdays.map(n => (
        <div
          key={n.id}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Cake size={20} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-amber-900">
                {n.name}&apos;s birthday is in {n.days_until} day{n.days_until !== 1 ? 's' : ''}
              </h4>
              <p className="text-xs text-amber-600 mt-0.5">
                {formatBirthday(n.birthday)} — Start thinking about a gift!
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleDismiss(n.id, 'greeted')}
                disabled={dismissing === n.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <Check size={12} />
                Already Greeted
              </button>
              <button
                onClick={() => handleDismiss(n.id, 'snoozed')}
                disabled={dismissing === n.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                <Clock size={12} />
                Remind Later
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Recent (missed) Birthdays */}
      {recentBirthdays.map(n => (
        <div
          key={n.id}
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Cake size={20} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-blue-900">
                {n.name}&apos;s birthday was {Math.abs(n.days_until)} day{Math.abs(n.days_until) !== 1 ? 's' : ''} ago
              </h4>
              <p className="text-xs text-blue-600 mt-0.5">
                {formatBirthday(n.birthday)} — It&apos;s not too late to send a belated wish!
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleDismiss(n.id, 'greeted')}
                disabled={dismissing === n.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                <Check size={12} />
                Already Greeted
              </button>
              <button
                onClick={() => handleDismiss(n.id, 'snoozed')}
                disabled={dismissing === n.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <Clock size={12} />
                Remind Later
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
