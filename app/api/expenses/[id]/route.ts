import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAuth();
  const body = await req.json();
  const hasDeptUpdate = 'department_id' in body;
  const rows = await sql`
    UPDATE public.expenses
    SET
      date = COALESCE(${body.date ?? null}, date),
      description = COALESCE(${body.description ?? null}, description),
      category = COALESCE(${body.category ?? null}, category),
      amount = COALESCE(${body.amount ?? null}, amount),
      currency = COALESCE(${body.currency ?? null}, currency),
      paid_by = COALESCE(${body.paid_by ?? null}, paid_by),
      task_id = COALESCE(${body.task_id ?? null}, task_id),
      department_id = ${hasDeptUpdate ? (body.department_id || null) : sql`department_id`}
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireAuth();
  await sql`DELETE FROM public.expenses WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
});