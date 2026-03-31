export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, requireManager, apiHandler } from '@/lib/api-auth';

// GET /api/departments
export const GET = apiHandler(async () => {
  await requireAuth();
  const rows = await sql`
    SELECT * FROM public.departments ORDER BY sort_order ASC
  `;
  return NextResponse.json(rows);
});

// POST /api/departments
export const POST = apiHandler(async (req) => {
  await requireManager();
  const body = await req.json();
  const { id, name, icon, type, sort_order } = body;

  const rows = await sql`
    INSERT INTO public.departments (id, name, icon, type, sort_order)
    VALUES (${id}, ${name}, ${icon}, ${type}, ${sort_order})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});