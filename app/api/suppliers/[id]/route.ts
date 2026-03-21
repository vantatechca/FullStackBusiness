import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAuth();
  const body = await req.json();
  const rows = await sql`
    UPDATE public.suppliers
    SET
      name = COALESCE(${body.name ?? null}, name),
      product = COALESCE(${body.product ?? null}, product),
      cogs = COALESCE(${body.cogs ?? null}, cogs),
      currency = COALESCE(${body.currency ?? null}, currency),
      qty = COALESCE(${body.qty ?? null}, qty),
      contact = COALESCE(${body.contact ?? null}, contact),
      status = COALESCE(${body.status ?? null}, status),
      notes = COALESCE(${body.notes ?? null}, notes)
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireAuth();
  await sql`DELETE FROM public.suppliers WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
});