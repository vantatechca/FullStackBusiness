export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

// GET /api/asset-category-notes
export const GET = apiHandler(async () => {
  await requireAuth();
  const rows = await sql`SELECT * FROM public.asset_category_notes ORDER BY category ASC`;
  return NextResponse.json(rows);
});

// POST /api/asset-category-notes — upsert by category
export const POST = apiHandler(async (req) => {
  await requireAuth();
  const { category, notes } = await req.json();
  if (!category) return NextResponse.json({ error: 'category required' }, { status: 400 });
  const rows = await sql`
    INSERT INTO public.asset_category_notes (category, notes)
    VALUES (${category}, ${notes || ''})
    ON CONFLICT (category) DO UPDATE SET notes = ${notes || ''}, updated_at = now()
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});
