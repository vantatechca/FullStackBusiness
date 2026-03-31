import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireManager, apiHandler } from '@/lib/api-auth';

// PATCH /api/team-members/[id]
export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireManager();
  const body = await req.json();

  const rows = await sql`
    UPDATE public.team_members
    SET
      name = COALESCE(${body.name ?? null}, name),
      role = COALESCE(${body.role ?? null}, role),
      email = COALESCE(${body.email ?? null}, email),
      departments = COALESCE(${body.departments ?? null}, departments),
      profit_pct = COALESCE(${body.profit_pct ?? null}, profit_pct),
      status = COALESCE(${body.status ?? null}, status)
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});

// DELETE /api/team-members/[id]
export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireManager();
  await sql`DELETE FROM public.team_members WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
});