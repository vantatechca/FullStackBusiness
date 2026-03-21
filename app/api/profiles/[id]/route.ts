import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, apiHandler } from '@/lib/api-auth';

// PATCH /api/profiles/[id] — admin updates role
export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const { role } = await req.json();

  if (!['admin', 'manager', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const rows = await sql`
    UPDATE public.profiles
    SET role = ${role}
    WHERE id = ${params.id}
    RETURNING id, email, full_name, role, created_at
  `;

  if (!rows[0]) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
});