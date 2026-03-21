import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireDeptAccess, apiHandler } from '@/lib/api-auth';

// GET /api/tasks?deptId=shopify
export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get('deptId') || '';

  await requireDeptAccess(deptId);

  const rows = await sql`
    SELECT * FROM public.tasks
    WHERE department_id = ${deptId}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
});

// POST /api/tasks
export const POST = apiHandler(async (req) => {
  const body = await req.json();
  const { department_id, task, status, assignee, deadline, priority, notes, recurrence } = body;

  const user = await requireDeptAccess(department_id);

  const rows = await sql`
    INSERT INTO public.tasks (department_id, task, status, assignee, deadline, priority, notes, recurrence, created_by)
    VALUES (${department_id}, ${task}, ${status}, ${assignee}, ${deadline}, ${priority}, ${notes}, ${recurrence}, ${user.id})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});