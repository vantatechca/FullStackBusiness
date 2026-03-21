import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAuth();
  const body = await req.json();
  const rows = await sql`
    UPDATE public.gmb_listings
    SET
      name = COALESCE(${body.name ?? null}, name),
      address = COALESCE(${body.address ?? null}, address),
      status = COALESCE(${body.status ?? null}, status),
      rating = COALESCE(${body.rating ?? null}, rating),
      reviews = COALESCE(${body.reviews ?? null}, reviews),
      notes = COALESCE(${body.notes ?? null}, notes)
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireAuth();
  await sql`DELETE FROM public.gmb_listings WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
});