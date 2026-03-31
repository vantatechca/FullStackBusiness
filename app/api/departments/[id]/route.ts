import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireManager, apiHandler } from '@/lib/api-auth';

// GET /api/departments/[id]
export const GET = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const rows = await sql`
    SELECT * FROM public.departments
    WHERE id = ${params.id}
    LIMIT 1
  `;
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
});

// PATCH /api/departments/[id]
export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireManager();
  const { name } = await req.json();

  const rows = await sql`
    UPDATE public.departments
    SET name = ${name}
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});

// DELETE /api/departments/[id]
export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireManager();

  await sql`DELETE FROM public.departments WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
});