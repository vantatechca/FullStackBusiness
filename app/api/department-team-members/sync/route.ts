import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

// POST /api/department-team-members/sync
// Called when team member's departments are updated.
// Adds new dept records and removes old ones.
// in_charge is ALWAYS false on insert — set independently per department.
export const POST = apiHandler(async (req) => {
  await requireAuth();
  const { name, departments } = await req.json();

  const newDeptIds = (departments || '').split(',').map((d: string) => d.trim()).filter(Boolean);

  // Get existing department assignments for this member
  const existing = await sql`
    SELECT id, department_id FROM public.department_team_members
    WHERE name = ${name}
  `;

  const existingDeptIds = existing.map((r: any) => r.department_id);

  // Remove departments no longer assigned
  const toRemove = existingDeptIds.filter((d: string) => !newDeptIds.includes(d));
  for (const deptId of toRemove) {
    await sql`
      DELETE FROM public.department_team_members
      WHERE name = ${name} AND department_id = ${deptId}
    `;
  }

  // Add new departments not yet assigned
  // in_charge is always false — Lead status is set manually per department card
  const toAdd = newDeptIds.filter((d: string) => !existingDeptIds.includes(d));
  for (const deptId of toAdd) {
    await sql`
      INSERT INTO public.department_team_members
        (department_id, name, in_charge, reports_to, hours_per_day, days_per_week,
         main_skills, tasks_love, tasks_hate, salary, salary_currency,
         bonus_structure, bonus_details, assigned_projects, notes, sort_order)
      VALUES
        (${deptId}, ${name}, false, '', 8, 5, '', '', '', 0, 'USD', false, '', '', '', 0)
    `;
  }

  return NextResponse.json({ success: true, added: toAdd, removed: toRemove });
});