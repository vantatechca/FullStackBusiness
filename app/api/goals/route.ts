import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

// GET /api/goals?deptId=shopify  (deptId is optional)
export const GET = apiHandler(async (req) => {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get('deptId');

  let rows;
  if (deptId) {
    rows = await sql`
      SELECT * FROM public.goals
      WHERE department_id = ${deptId}
      ORDER BY created_at DESC
    `;
  } else {
    rows = await sql`
      SELECT * FROM public.goals
      ORDER BY created_at DESC
    `;
  }
  return NextResponse.json(rows);
});

// POST /api/goals
export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const body = await req.json();
  const {
    title, type, target_value, current_value,
    currency, department_id, period,
    start_date, end_date, status, notes,
  } = body;

  const rows = await sql`
    INSERT INTO public.goals (
      title, type, target_value, current_value,
      currency, department_id, period,
      start_date, end_date, status, notes, created_by
    )
    VALUES (
      ${title}, ${type || 'custom'}, ${target_value || 0}, ${current_value || 0},
      ${currency || 'USD'}, ${department_id || null}, ${period || 'monthly'},
      ${start_date || null}, ${end_date || null}, ${status || 'active'}, ${notes || ''}, ${user.id}
    )
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});
