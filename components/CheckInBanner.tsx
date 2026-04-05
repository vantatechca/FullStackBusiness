'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface CheckInBannerProps {
  onOpenCheckIn: () => void;
}

export default function CheckInBanner({ onOpenCheckIn }: CheckInBannerProps) {
  const { profile } = useAuth();
  const [hasCheckedIn, setHasCheckedIn] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!profile) return;
    fetch('/api/checkins/today')
      .then(r => r.json())
      .then(data => {
        setHasCheckedIn(data.hasCheckedIn);
        // Fetch streak from profile
        fetch(`/api/table-data?table=profiles`)
          .then(r => r.json())
          .then(profiles => {
            const me = (profiles || []).find((p: any) => p.id === profile.id);
            if (me?.checkin_streak) setStreak(me.checkin_streak);
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [profile]);

  // Don't show if already checked in, still loading, or dismissed
  if (hasCheckedIn === null || hasCheckedIn || dismissed) return null;

  return (
    <div className="mb-4 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-[#3b82f6] flex items-center justify-center shrink-0">
        <Sparkles size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">
          You haven&apos;t checked in today
        </p>
        <p className="text-xs text-gray-500">
          {streak > 0
            ? `You're on a ${streak}-day streak! Keep it going.`
            : 'Complete your daily check-in to track progress and update metrics.'
          }
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenCheckIn}
          className="px-4 py-2 bg-[#3b82f6] text-white text-xs font-semibold rounded-lg hover:bg-[#2563eb] transition-colors shadow-sm"
        >
          Check In Now
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 hover:text-gray-600 transition-colors"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
