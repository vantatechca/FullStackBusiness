export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin, apiHandler } from '@/lib/api-auth';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const { id } = await params;
  const body = await req.json();

  const fields: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  for (const [key, value] of Object.entries(body)) {
    if (['name', 'birthday', 'notes'].includes(key)) {
      fields.push(`${key} = $${paramIdx}`);
      values.push(value);
      paramIdx++;
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  values.push(id);
  const query = `UPDATE public.business_partners SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`;
  const rows = await sql(query, values);

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
