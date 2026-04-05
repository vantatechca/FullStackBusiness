export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';
import { createNoteSchema } from '@/lib/validations';

export const POST = apiHandler(async (req) => {
  await requireAuth();
  const raw = await req.json();
  const parsed = createNoteSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { department_id, content, updated_at } = parsed.data;
  const rows = await sql`
    INSERT INTO public.department_notes (department_id, content, updated_at)
    VALUES (${department_id}, ${content}, ${updated_at})
    ON CONFLICT (department_id) DO UPDATE
    SET content = ${content}, updated_at = ${updated_at}
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});