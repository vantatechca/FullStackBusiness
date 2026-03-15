'use client';

import { useEffect } from 'react';
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
import NetProfitView from '@/components/NetProfitView';
import AdminPanel from '@/components/AdminPanel';

export default function DepartmentPage({ params }: { params: { deptId: string } }) {
  const { canAccessDepartment, loading } = useAuth();
  const router = useRouter();
  const dept = getDepartment(params.deptId);

  useEffect(() => {
    if (!loading && dept && !canAccessDepartment(dept.id)) {
      router.push('/dashboard');
    }
  }, [loading, dept, canAccessDepartment, router]);

  if (!dept) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Department not found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
      </div>
    );
  }

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
    case 'expenses-global':
      return <GlobalExpensesView />;
    case 'net-profit':
      return <NetProfitView />;
    case 'admin':
      return <AdminPanel />;
    default:
      return <StandardDepartment departmentId={dept.id} />;
  }
}
