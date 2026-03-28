import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAuth();
  const body = await req.json();

  const rows = await sql`
    UPDATE public.goals
    SET
      title         = COALESCE(${body.title ?? null}, title),
      type          = COALESCE(${body.type ?? null}, type),
      target_value  = COALESCE(${body.target_value ?? null}, target_value),
      current_value = COALESCE(${body.current_value ?? null}, current_value),
      currency      = COALESCE(${body.currency ?? null}, currency),
      department_id = COALESCE(${body.department_id ?? null}, department_id),
      period        = COALESCE(${body.period ?? null}, period),
      start_date    = COALESCE(${body.start_date ?? null}, start_date),
      end_date      = COALESCE(${body.end_date ?? null}, end_date),
      status        = COALESCE(${body.status ?? null}, status),
      notes         = COALESCE(${body.notes ?? null}, notes)
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireAuth();
  await sql`DELETE FROM public.goals WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
});
