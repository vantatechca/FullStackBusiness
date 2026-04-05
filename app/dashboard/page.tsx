'use client';

import DashboardOverview from '@/components/DashboardOverview';
import CheckInBanner from '@/components/CheckInBanner';
import { useCheckIn } from '@/lib/checkin-context';

export default function DashboardPage() {
  const { openCheckIn } = useCheckIn();

  return (
    <>
      <CheckInBanner onOpenCheckIn={openCheckIn} />
      <DashboardOverview />
    </>
  );
}
