
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getDepartment } from '@/lib/departments';
import StandardDepartment from '@/components/StandardDepartment';
import GMBDepartment from '@/components/GMBDepartment';
import InfluencersDepartment from '@/components/InfluencersDepartment';
import RestockDepartment from '@/components/RestockDepartment';
import TeamView from '@/components/TeamView';
import GlobalTasksView from '@/components/GlobalTasksView';
import GlobalExpensesView from '@/components/GlobalExpensesView';
import GlobalRevenueView from '@/components/GlobalRevenueView';
import NetProfitView from '@/components/NetProfitView';
import AdminPanel from '@/components/AdminPanel';
import AssetsView from '@/components/AssetsView';
import CheckInHistoryView from '@/components/CheckInHistoryView';

interface Department {
  id: string;
  name: string;
  icon: string;
  type: string;
  sort_order: number;
}

export default function DepartmentPage({ params }: { params: { deptId: string } }) {
  const { canAccessDepartment, loading } = useAuth();
  const router = useRouter();

  // Try static lookup first
  const staticDept = getDepartment(params.deptId);

  // DB fallback state — only used when static lookup misses
  const [dbDept, setDbDept] = useState<Department | null>(null);
  const [dbLoading, setDbLoading] = useState(!staticDept);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (staticDept) return; // static hit — no need to fetch

    setDbLoading(true);
    fetch(`/api/departments/${params.deptId}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setDbDept(data);
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => {
        setDbLoading(false);
      });
  }, [params.deptId, staticDept]);

  // Access guard
  useEffect(() => {
    const dept = staticDept ?? dbDept;
    if (!loading && dept && !canAccessDepartment(dept.id)) {
      router.push('/dashboard');
    }
  }, [loading, staticDept, dbDept, canAccessDepartment, router]);

  // ── Loading states ──────────────────────────────────────────────
  if (loading || dbLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────
  if (notFound || (!staticDept && !dbDept)) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Department not found.</p>
      </div>
    );
  }

  // ── Resolve dept (static wins, DB fallback for dynamic ones) ────
  const dept = staticDept ?? dbDept!;

  // ── Render by type ──────────────────────────────────────────────
  switch (dept.type) {
    case 'standard':
      return <StandardDepartment departmentId={dept.id} />;
    case 'gmb':
      return <GMBDepartment departmentId={dept.id} />;
    case 'influencers':
      return <InfluencersDepartment departmentId={dept.id} />;
    case 'restock':
      return <RestockDepartment departmentId={dept.id} />;
    case 'team':
      return <TeamView />;
    case 'tasks':
      return <GlobalTasksView />;
    case 'assets':
      return <AssetsView />;
    case 'expenses-global':
      return <GlobalExpensesView />;
    case 'revenue-global':
      return <GlobalRevenueView />;
    case 'net-profit':
      return <NetProfitView />;
    case 'admin':
      return <AdminPanel />;
    case 'checkins':
      return <CheckInHistoryView />;
    default:
      // All dynamically created departments land here — StandardDepartment
      // is the universal fallback with tasks, team, expenses tabs built in
      return <StandardDepartment departmentId={dept.id} />;
  }
}