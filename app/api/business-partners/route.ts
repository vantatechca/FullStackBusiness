export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, requireAdmin, apiHandler } from '@/lib/api-auth';

export const GET = apiHandler(async () => {
  await requireAuth();
  const rows = await sql`SELECT * FROM public.business_partners ORDER BY name ASC`;
  return NextResponse.json(rows);
});

export const POST = apiHandler(async (req) => {
  const user = await requireAdmin();
  const { name, birthday, notes } = await req.json();
  const rows = await sql`
    INSERT INTO public.business_partners (name, birthday, notes, created_by)
    VALUES (${name}, ${birthday || null}, ${notes || ''}, ${user.id})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});
