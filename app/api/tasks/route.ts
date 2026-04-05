export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, requireDeptAccess, apiHandler } from '@/lib/api-auth';
import { createTaskSchema } from '@/lib/validations';

// GET /api/tasks?deptId=shopify  (deptId is optional — omit to get all tasks)
export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get('deptId');

  if (deptId) {
    await requireDeptAccess(deptId);
    const rows = await sql`
      SELECT * FROM public.tasks
      WHERE department_id = ${deptId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  }

  // No deptId — return all tasks (auth required)
  await requireAuth();
  const rows = await sql`
    SELECT * FROM public.tasks
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
});

// POST /api/tasks  (department_id is now optional)
export const POST = apiHandler(async (req) => {
  const raw = await req.json();
  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { department_id, task, status, assignee, assignees, deadline, priority, notes, recurrence, goal_target, goal_current } = parsed.data;

  let user;
  if (department_id) {
    user = await requireDeptAccess(department_id);
  } else {
    user = await requireAuth();
  }

  const rows = await sql`
    INSERT INTO public.tasks (department_id, task, status, assignee, assignees, deadline, priority, notes, recurrence, goal_target, goal_current, created_by)
    VALUES (${department_id || null}, ${task}, ${status}, ${assignee || ''}, ${(assignees || []) as any}, ${deadline || null}, ${priority}, ${notes || ''}, ${recurrence || 'One-Time'}, ${goal_target ?? 0}, ${goal_current ?? 0}, ${user.id})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});
