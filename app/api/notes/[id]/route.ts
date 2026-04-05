import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';
import { updateNoteSchema } from '@/lib/validations';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAuth();
  const raw = await req.json();
  const parsed = updateNoteSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { content, updated_at } = parsed.data;
  const rows = await sql`
    UPDATE public.department_notes
    SET content = ${content}, updated_at = ${updated_at}
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});