export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, requireManager, apiHandler } from '@/lib/api-auth';
import { createTeamMemberSchema } from '@/lib/validations';

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
  await requireManager();
  const raw = await req.json();
  const parsed = createTeamMemberSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { name, role, email, departments, profit_pct, status } = parsed.data;

  const rows = await sql`
    INSERT INTO public.team_members (name, role, email, departments, profit_pct, status)
    VALUES (${name}, ${role}, ${email}, ${departments}, ${profit_pct}, ${status})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});