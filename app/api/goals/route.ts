export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';
import { createGoalSchema } from '@/lib/validations';

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
  const raw = await req.json();
  const parsed = createGoalSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const {
    title, type, target_value, current_value,
    currency, department_id, period,
    start_date, end_date, status, notes,
  } = parsed.data;

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
