import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  await requireAuth();
  const body = await req.json();
  const rows = await sql`
    UPDATE public.influencers
    SET
      name = COALESCE(${body.name ?? null}, name),
      platform = COALESCE(${body.platform ?? null}, platform),
      followers = COALESCE(${body.followers ?? null}, followers),
      promo_code = COALESCE(${body.promo_code ?? null}, promo_code),
      commission_pct = COALESCE(${body.commission_pct ?? null}, commission_pct),
      revenue = COALESCE(${body.revenue ?? null}, revenue),
      contact = COALESCE(${body.contact ?? null}, contact),
      notes = COALESCE(${body.notes ?? null}, notes)
    WHERE id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(rows[0]);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireAuth();
  await sql`DELETE FROM public.influencers WHERE id = ${params.id}`;
  return NextResponse.json({ success: true });
});