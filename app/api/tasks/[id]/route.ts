import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAuth();
  const body = await req.json();
  const rows = await sql`
    UPDATE public.tasks
    SET
      task = COALESCE(${body.task ?? null}, task),
      recurrence = COALESCE(${body.recurrence ?? null}, recurrence),
      status = COALESCE(${body.status ?? null}, status),
      assignee = COALESCE(${body.assignee ?? null}, assignee),
      deadline = COALESCE(${body.deadline ?? null}, deadline),
      priority = COALESCE(${body.priority ?? null}, priority),
      notes = COALESCE(${body.notes ?? null}, notes)
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireAuth();
  await sql`DELETE FROM public.tasks WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
});