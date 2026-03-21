import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, apiHandler } from '@/lib/api-auth';

// DELETE /api/department-team-members/by-name
// Body: { name: string }
// Removes all department_team_members rows matching the given name
export const DELETE = apiHandler(async (req) => {
  await requireAdmin();
  const { name } = await req.json();

  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  await sql`
    DELETE FROM public.department_team_members
    WHERE name = ${name}
  `;

  return NextResponse.json({ success: true });
});