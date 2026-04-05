'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

interface CheckInContextValue {
  hasCheckedIn: boolean | null;
  showModal: boolean;
  openCheckIn: () => void;
  closeCheckIn: () => void;
  markComplete: () => void;
}

const CheckInContext = createContext<CheckInContextValue>({
  hasCheckedIn: null,
  showModal: false,
  openCheckIn: () => {},
  closeCheckIn: () => {},
  markComplete: () => {},
});

export function CheckInProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [hasCheckedIn, setHasCheckedIn] = useState<boolean | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [autoPrompted, setAutoPrompted] = useState(false);

  // Check status on mount
  useEffect(() => {
    if (!profile) return;
    fetch('/api/checkins/today')
      .then(r => r.json())
      .then(data => {
        setHasCheckedIn(data.hasCheckedIn);
        // Auto-open modal for members/leads who haven't checked in
        if (!data.hasCheckedIn && !autoPrompted && (profile.role === 'member' || profile.role === 'lead')) {
          setAutoPrompted(true);
          // Small delay so dashboard loads first
          setTimeout(() => setShowModal(true), 800);
        }
      })
      .catch(() => {});
  }, [profile, autoPrompted]);

  const openCheckIn = useCallback(() => setShowModal(true), []);
  const closeCheckIn = useCallback(() => setShowModal(false), []);
  const markComplete = useCallback(() => {
    setHasCheckedIn(true);
    setShowModal(false);
  }, []);

  return (
    <CheckInContext.Provider value={{ hasCheckedIn, showModal, openCheckIn, closeCheckIn, markComplete }}>
      {children}
    </CheckInContext.Provider>
  );
}

export function useCheckIn() {
  return useContext(CheckInContext);
}
