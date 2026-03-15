'use client';

import SubTabs from './SubTabs';
import DepartmentTeamSection from './DepartmentTeamSection';
import RevenueSection from './RevenueSection';
import ExpensesSection from './ExpensesSection';
import TasksSection from './TasksSection';
import NotesSection from './NotesSection';

const TABS = [
  { id: 'team', label: 'Team' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Notes' },
];

export default function StandardDepartment({ departmentId }: { departmentId: string }) {
  return (
    <SubTabs tabs={TABS}>
      {(activeTab) => (
        <>
          {activeTab === 'team' && <DepartmentTeamSection departmentId={departmentId} />}
          {activeTab === 'revenue' && <RevenueSection departmentId={departmentId} />}
          {activeTab === 'expenses' && <ExpensesSection departmentId={departmentId} />}
          {activeTab === 'tasks' && <TasksSection departmentId={departmentId} />}
          {activeTab === 'notes' && <NotesSection departmentId={departmentId} />}
        </>
      )}
    </SubTabs>
  );
}
