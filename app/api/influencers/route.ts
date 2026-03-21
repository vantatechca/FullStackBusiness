import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const GET = apiHandler(async () => {
  await requireAuth();
  const rows = await sql`SELECT * FROM public.influencers ORDER BY created_at ASC`;
  return NextResponse.json(rows);
});

export const POST = apiHandler(async (req) => {
  await requireAuth();
  const { name, platform, followers, promo_code, commission_pct, revenue, contact, notes } = await req.json();
  const rows = await sql`
    INSERT INTO public.influencers (name, platform, followers, promo_code, commission_pct, revenue, contact, notes)
    VALUES (${name}, ${platform}, ${followers}, ${promo_code}, ${commission_pct}, ${revenue}, ${contact}, ${notes})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});