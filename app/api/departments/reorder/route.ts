import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireManager, apiHandler } from '@/lib/api-auth';

// PATCH /api/departments/reorder
export const PATCH = apiHandler(async (req) => {
  await requireManager();
  const { ids } = await req.json() as { ids: string[] };

  await Promise.all(
    ids.map((id, index) =>
      sql`UPDATE public.departments SET sort_order = ${index} WHERE id = ${id}`
    )
  );

  return NextResponse.json({ ok: true });
});