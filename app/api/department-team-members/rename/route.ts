import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const POST = apiHandler(async (req) => {
  await requireAuth();
  const { oldName, newName, departments } = await req.json();

  const deptIds = departments.split(',').map((d: string) => d.trim()).filter(Boolean);
  for (const deptId of deptIds) {
    await sql`
      UPDATE public.department_team_members
      SET name = ${newName}
      WHERE department_id = ${deptId} AND name = ${oldName}
    `;
  }

  return NextResponse.json({ success: true });
});