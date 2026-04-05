import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';
import { updateRevenueSchema } from '@/lib/validations';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAuth();
  const body = await req.json();
  const parsed = updateRevenueSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const rows = await sql`
    UPDATE public.revenue
    SET
      date = COALESCE(${body.date ?? null}, date),
      source = COALESCE(${body.source ?? null}, source),
      amount = COALESCE(${body.amount ?? null}, amount),
      currency = COALESCE(${body.currency ?? null}, currency),
      notes = COALESCE(${body.notes ?? null}, notes)
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireAuth();
  await sql`DELETE FROM public.revenue WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
});