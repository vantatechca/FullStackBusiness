// import { NextResponse } from 'next/server';
// import { sql } from '@/lib/db';
// import { requireAuth, apiHandler } from '@/lib/api-auth';

// // PATCH /api/department-team-members/[id]
// export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
//   await requireAuth();
//   const body = await req.json();

//   if (Object.keys(body).length === 0) {
//     return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
//   }

//   const rows = await sql`
//     UPDATE public.department_team_members
//     SET
//       name             = COALESCE(${body.name             ?? null}, name),
//       in_charge        = COALESCE(${body.in_charge        ?? null}, in_charge),
//       reports_to       = COALESCE(${body.reports_to       ?? null}, reports_to),
//       hours_per_day    = COALESCE(${body.hours_per_day    ?? null}, hours_per_day),
//       days_per_week    = COALESCE(${body.days_per_week    ?? null}, days_per_week),
//       main_skills      = COALESCE(${body.main_skills      ?? null}, main_skills),
//       tasks_love       = COALESCE(${body.tasks_love       ?? null}, tasks_love),
//       tasks_hate       = COALESCE(${body.tasks_hate       ?? null}, tasks_hate),
//       salary           = COALESCE(${body.salary           ?? null}, salary),
//       salary_currency  = COALESCE(${body.salary_currency  ?? null}, salary_currency),
//       bonus_structure  = COALESCE(${body.bonus_structure  ?? null}, bonus_structure),
//       bonus_details    = COALESCE(${body.bonus_details    ?? null}, bonus_details),
//       assigned_projects= COALESCE(${body.assigned_projects ?? null}, assigned_projects),
//       notes            = COALESCE(${body.notes            ?? null}, notes),
//       sort_order       = COALESCE(${body.sort_order       ?? null}, sort_order)
//     WHERE id = ${params.id}
//     RETURNING *
//   `;
//   return NextResponse.json(rows[0]);
// });

// // DELETE /api/department-team-members/[id]
// export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
//   await requireAuth();
//   await sql`DELETE FROM public.department_team_members WHERE id = ${params.id}`;
//   return NextResponse.json({ success: true });
// });


import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

// PATCH /api/department-team-members/[id]
export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAuth();
  const body = await req.json();

  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const rows = await sql`
    UPDATE public.department_team_members
    SET
      name             = COALESCE(${body.name             ?? null}, name),
      in_charge        = COALESCE(${body.in_charge        ?? null}, in_charge),
      reports_to       = COALESCE(${body.reports_to       ?? null}, reports_to),
      hours_per_day    = COALESCE(${body.hours_per_day    ?? null}, hours_per_day),
      days_per_week    = COALESCE(${body.days_per_week    ?? null}, days_per_week),
      main_skills      = COALESCE(${body.main_skills      ?? null}, main_skills),
      tasks_love       = COALESCE(${body.tasks_love       ?? null}, tasks_love),
      tasks_hate       = COALESCE(${body.tasks_hate       ?? null}, tasks_hate),
      salary           = COALESCE(${body.salary           ?? null}, salary),
      salary_currency  = COALESCE(${body.salary_currency  ?? null}, salary_currency),
      bonus_structure  = COALESCE(${body.bonus_structure  ?? null}, bonus_structure),
      bonus_details    = COALESCE(${body.bonus_details    ?? null}, bonus_details),
      assigned_projects= COALESCE(${body.assigned_projects ?? null}, assigned_projects),
      notes            = COALESCE(${body.notes            ?? null}, notes),
      sort_order       = COALESCE(${body.sort_order       ?? null}, sort_order)
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});

// DELETE /api/department-team-members/[id]
export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireAuth();
  await sql`DELETE FROM public.department_team_members WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
});