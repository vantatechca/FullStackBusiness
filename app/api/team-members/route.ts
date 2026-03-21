import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, requireAdmin, apiHandler } from '@/lib/api-auth';

// GET /api/team-members
// GET /api/team-members?name=John (lookup by name)
export const GET = apiHandler(async (req) => {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name');

  if (name) {
    const rows = await sql`
      SELECT * FROM public.team_members WHERE name = ${name} LIMIT 1
    `;
    return NextResponse.json(rows[0] || null);
  }

  const rows = await sql`SELECT * FROM public.team_members ORDER BY created_at ASC`;
  return NextResponse.json(rows);
});

// POST /api/team-members
export const POST = apiHandler(async (req) => {
  await requireAdmin();
  const body = await req.json();
  const { name, role, email, departments, profit_pct, status } = body;

  const rows = await sql`
    INSERT INTO public.team_members (name, role, email, departments, profit_pct, status)
    VALUES (${name}, ${role}, ${email}, ${departments}, ${profit_pct}, ${status})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});