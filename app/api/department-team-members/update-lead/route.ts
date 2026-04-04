import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

// POST /api/department-team-members/update-lead
// Only updates in_charge for a SPECIFIC department — never all at once
export const POST = apiHandler(async (req) => {
  await requireAuth();
  const { name, department_id, in_charge } = await req.json();

  if (!department_id) {
    return NextResponse.json({ error: 'department_id is required' }, { status: 400 });
  }

  await sql`
    UPDATE public.department_team_members
    SET in_charge = ${in_charge}
    WHERE department_id = ${department_id} AND name = ${name}
  `;

  return NextResponse.json({ success: true });
});