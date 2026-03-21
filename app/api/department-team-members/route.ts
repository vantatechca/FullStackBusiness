import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, requireDeptAccess, apiHandler } from '@/lib/api-auth';

// GET /api/department-team-members?name=X&department_id=Y  — lookup single row
// GET /api/department-team-members?department_id=Y         — all rows for a dept
export const GET = apiHandler(async (req) => {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');
  const department_id = searchParams.get('department_id');

  if (name && department_id) {
    const rows = await sql`
      SELECT * FROM public.department_team_members
      WHERE name = ${name} AND department_id = ${department_id}
      LIMIT 1
    `;
    return NextResponse.json(rows[0] ?? null);
  }

  if (department_id) {
    const rows = await sql`
      SELECT * FROM public.department_team_members
      WHERE department_id = ${department_id}
      ORDER BY sort_order ASC
    `;
    return NextResponse.json(rows);
  }

  return NextResponse.json({ error: 'department_id is required' }, { status: 400 });
});

// POST /api/department-team-members
export const POST = apiHandler(async (req) => {
  const body = await req.json();
  const { department_id } = body;

  await requireDeptAccess(department_id);

  const rows = await sql`
    INSERT INTO public.department_team_members (
      department_id, name, in_charge, reports_to, hours_per_day, days_per_week,
      main_skills, tasks_love, tasks_hate, salary, salary_currency,
      bonus_structure, bonus_details, assigned_projects, notes, sort_order, created_by
    ) VALUES (
      ${body.department_id}, ${body.name}, ${body.in_charge}, ${body.reports_to},
      ${body.hours_per_day}, ${body.days_per_week}, ${body.main_skills},
      ${body.tasks_love}, ${body.tasks_hate}, ${body.salary}, ${body.salary_currency},
      ${body.bonus_structure}, ${body.bonus_details}, ${body.assigned_projects},
      ${body.notes}, ${body.sort_order}, ${body.created_by}
    )
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});