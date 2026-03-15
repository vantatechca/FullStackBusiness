'use client';

import SubTabs from './SubTabs';
import RestockView from './RestockView';
import DepartmentTeamSection from './DepartmentTeamSection';
import RevenueSection from './RevenueSection';
import ExpensesSection from './ExpensesSection';
import TasksSection from './TasksSection';
import NotesSection from './NotesSection';

const TABS = [
  { id: 'team', label: 'Team' },
  { id: 'suppliers', label: 'Suppliers & COGS' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Notes' },
];

export default function RestockDepartment({ departmentId }: { departmentId: string }) {
  return (
    <SubTabs tabs={TABS}>
      {(activeTab) => (
        <>
          {activeTab === 'team' && <DepartmentTeamSection departmentId={departmentId} />}
          {activeTab === 'suppliers' && <RestockView />}
          {activeTab === 'revenue' && <RevenueSection departmentId={departmentId} />}
          {activeTab === 'expenses' && <ExpensesSection departmentId={departmentId} />}
          {activeTab === 'tasks' && <TasksSection departmentId={departmentId} />}
          {activeTab === 'notes' && <NotesSection departmentId={departmentId} />}
        </>
      )}
    </SubTabs>
  );
}
