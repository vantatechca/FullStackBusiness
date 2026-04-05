
'use client';

import { useAuth } from '@/lib/auth-context';
import { CurrencyProvider } from '@/lib/currency-context';
import { DepartmentProvider } from '@/lib/department-context';
import { CheckInProvider, useCheckIn } from '@/lib/checkin-context';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import QuickAddButton from '@/components/QuickAddButton';
import CheckInModal from '@/components/CheckInModal';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile) {
      router.replace('/login');
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <CurrencyProvider>
      <DepartmentProvider>
        <CheckInProvider>
          <DashboardShell>{children}</DashboardShell>
        </CheckInProvider>
      </DepartmentProvider>
    </CurrencyProvider>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { showModal, closeCheckIn, markComplete } = useCheckIn();

  return (
    <>
      <div className="flex min-h-screen bg-[#f8fafc]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-6 overflow-x-hidden">
            {children}
          </main>
        </div>
        <QuickAddButton />
      </div>
      <CheckInModal
        open={showModal}
        onClose={closeCheckIn}
        onComplete={markComplete}
      />
    </>
  );
}