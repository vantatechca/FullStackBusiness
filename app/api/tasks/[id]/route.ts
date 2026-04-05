import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';
import { updateTaskSchema } from '@/lib/validations';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAuth();
  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  // Normalise assignees: accept array or fall back to legacy string
  const assignees: string[] | null =
    Array.isArray(body.assignees)
      ? body.assignees.filter(Boolean)
      : body.assignee
        ? [body.assignee]
        : null;

  // Legacy single-assignee kept in sync (first element, or cleared)
  const assignee: string | null =
    assignees && assignees.length > 0 ? assignees[0] : (body.assignee ?? null);

  const rows = await sql`
    UPDATE public.tasks
    SET
      task          = COALESCE(${body.task          ?? null}, task),
      recurrence    = COALESCE(${body.recurrence    ?? null}, recurrence),
      status        = COALESCE(${body.status        ?? null}, status),
      assignee      = COALESCE(${assignee},                   assignee),
      assignees     = COALESCE(${assignees as any},           assignees),
      deadline      = COALESCE(${body.deadline      ?? null}, deadline),
      priority      = COALESCE(${body.priority      ?? null}, priority),
      notes         = COALESCE(${body.notes         ?? null}, notes),
      goal_target   = COALESCE(${body.goal_target   ?? null}, goal_target),
      goal_current  = COALESCE(${body.goal_current  ?? null}, goal_current)
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