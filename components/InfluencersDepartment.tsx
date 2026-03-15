'use client';

import SubTabs from './SubTabs';
import InfluencersView from './InfluencersView';
import DepartmentTeamSection from './DepartmentTeamSection';
import RevenueSection from './RevenueSection';
import ExpensesSection from './ExpensesSection';
import TasksSection from './TasksSection';
import NotesSection from './NotesSection';

const TABS = [
  { id: 'team', label: 'Team' },
  { id: 'influencers', label: 'Influencers' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Notes' },
];

export default function InfluencersDepartment({ departmentId }: { departmentId: string }) {
  return (
    <SubTabs tabs={TABS}>
      {(activeTab) => (
        <>
          {activeTab === 'team' && <DepartmentTeamSection departmentId={departmentId} />}
          {activeTab === 'influencers' && <InfluencersView />}
          {activeTab === 'revenue' && <RevenueSection departmentId={departmentId} />}
          {activeTab === 'expenses' && <ExpensesSection departmentId={departmentId} />}
          {activeTab === 'tasks' && <TasksSection departmentId={departmentId} />}
          {activeTab === 'notes' && <NotesSection departmentId={departmentId} />}
        </>
      )}
    </SubTabs>
  );
}
