export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

// GET /api/asset-category-notes
export const GET = apiHandler(async () => {
  await requireAuth();
  const rows = await sql`SELECT * FROM public.asset_category_notes ORDER BY sort_order ASC, category ASC`;
  return NextResponse.json(rows);
});

// POST /api/asset-category-notes — upsert by category
export const POST = apiHandler(async (req) => {
  await requireAuth();
  const { category, notes, sort_order } = await req.json();
  if (!category) return NextResponse.json({ error: 'category required' }, { status: 400 });
  const rows = await sql`
    INSERT INTO public.asset_category_notes (category, notes, sort_order)
    VALUES (${category}, ${notes || ''}, ${sort_order ?? 0})
    ON CONFLICT (category) DO UPDATE SET
      notes = COALESCE(${notes ?? null}, asset_category_notes.notes),
      sort_order = COALESCE(${sort_order ?? null}, asset_category_notes.sort_order),
      updated_at = now()
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});

// PATCH /api/asset-category-notes — bulk reorder: { categories: ['Orders', 'Sites', ...] }
export const PATCH = apiHandler(async (req) => {
  await requireAuth();
  const { categories } = await req.json();
  if (!Array.isArray(categories)) return NextResponse.json({ error: 'categories array required' }, { status: 400 });

  for (let i = 0; i < categories.length; i++) {
    await sql`
      INSERT INTO public.asset_category_notes (category, sort_order)
      VALUES (${categories[i]}, ${i})
      ON CONFLICT (category) DO UPDATE SET sort_order = ${i}, updated_at = now()
    `;
  }
  return NextResponse.json({ success: true });
});
