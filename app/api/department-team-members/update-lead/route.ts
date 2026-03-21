import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const POST = apiHandler(async (req) => {
  await requireAuth();
  const { name, departments, in_charge } = await req.json();

  const deptIds = (departments || '').split(',').map((d: string) => d.trim()).filter(Boolean);
  for (const deptId of deptIds) {
    await sql`
      UPDATE public.department_team_members
      SET in_charge = ${in_charge}
      WHERE department_id = ${deptId} AND name = ${name}
    `;
  }

  return NextResponse.json({ success: true });
});