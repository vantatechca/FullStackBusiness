// app/api/department-roles/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const GET = apiHandler(async (req) => {
  await requireAuth();
  const deptId = new URL(req.url).searchParams.get('department_id');
  if (!deptId) return NextResponse.json({ error: 'department_id required' }, { status: 400 });

  const rows = await sql`
    SELECT id, role_name, headcount, daily_output
    FROM public.department_roles
    WHERE department_id = ${deptId}
    ORDER BY sort_order ASC
  `;
  return NextResponse.json(rows);
});