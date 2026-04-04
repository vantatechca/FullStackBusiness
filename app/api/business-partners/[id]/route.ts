export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, apiHandler } from '@/lib/api-auth';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json();
  const rows = await sql`
    UPDATE public.business_partners
    SET
      name = COALESCE(${body.name ?? null}, name),
      birthday = COALESCE(${body.birthday ?? null}, birthday),
      notes = COALESCE(${body.notes ?? null}, notes)
    WHERE id = ${id}
    RETURNING *
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const { id } = await params;
  await sql`DELETE FROM public.business_partners WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
});
