'use client';

import SubTabs from './SubTabs';
import GMBView from './GMBView';
import DepartmentTeamSection from './DepartmentTeamSection';
import RevenueSection from './RevenueSection';
import ExpensesSection from './ExpensesSection';
import TasksSection from './TasksSection';
import NotesSection from './NotesSection';

const TABS = [
  { id: 'team', label: 'Team' },
  { id: 'listings', label: 'Listings & Reviews' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Notes' },
];

export default function GMBDepartment({ departmentId }: { departmentId: string }) {
  return (
    <SubTabs tabs={TABS}>
      {(activeTab) => (
        <>
          {activeTab === 'team' && <DepartmentTeamSection departmentId={departmentId} />}
          {activeTab === 'listings' && <GMBView />}
          {activeTab === 'revenue' && <RevenueSection departmentId={departmentId} />}
          {activeTab === 'expenses' && <ExpensesSection departmentId={departmentId} />}
          {activeTab === 'tasks' && <TasksSection departmentId={departmentId} />}
          {activeTab === 'notes' && <NotesSection departmentId={departmentId} />}
        </>
      )}
    </SubTabs>
  );
}
