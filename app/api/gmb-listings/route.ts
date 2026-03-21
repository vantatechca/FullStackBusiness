import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const GET = apiHandler(async () => {
  await requireAuth();
  const rows = await sql`SELECT * FROM public.gmb_listings ORDER BY created_at ASC`;
  return NextResponse.json(rows);
});

export const POST = apiHandler(async (req) => {
  await requireAuth();
  const { name, address, status, rating, reviews, notes } = await req.json();
  const rows = await sql`
    INSERT INTO public.gmb_listings (name, address, status, rating, reviews, notes)
    VALUES (${name}, ${address}, ${status}, ${rating}, ${reviews}, ${notes})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});