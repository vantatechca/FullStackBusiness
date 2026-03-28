export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const POST = apiHandler(async (req) => {
  await requireAuth();
  const { department_id, content, updated_at } = await req.json();
  const rows = await sql`
    INSERT INTO public.department_notes (department_id, content, updated_at)
    VALUES (${department_id}, ${content}, ${updated_at})
    ON CONFLICT (department_id) DO UPDATE
    SET content = ${content}, updated_at = ${updated_at}
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});