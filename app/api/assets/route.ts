export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

// GET /api/assets
export const GET = apiHandler(async () => {
  await requireAuth();
  const rows = await sql`
    SELECT * FROM public.assets ORDER BY sort_order ASC, category ASC, metric ASC
  `;
  return NextResponse.json(rows);
});

// POST /api/assets
export const POST = apiHandler(async (req) => {
  await requireAuth();
  const body = await req.json();
  const { category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id } = body;
  const rows = await sql`
    INSERT INTO public.assets (category, metric, value, previous_value, direction, tracking, sort_order, notes, department_id)
    VALUES (${category}, ${metric}, ${value ?? 0}, ${previous_value ?? 0}, ${direction || 'up_good'}, ${tracking || 'total'}, ${sort_order ?? 0}, ${notes || ''}, ${department_id || null})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});

// PATCH /api/assets — bulk "end of day" snapshot: copies value → previous_value for all rows
export const PATCH = apiHandler(async () => {
  await requireAuth();
  await sql`UPDATE public.assets SET previous_value = value`;
  return NextResponse.json({ success: true });
});
