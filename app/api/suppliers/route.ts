import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const GET = apiHandler(async () => {
  await requireAuth();
  const rows = await sql`SELECT * FROM public.suppliers ORDER BY created_at ASC`;
  return NextResponse.json(rows);
});

export const POST = apiHandler(async (req) => {
  await requireAuth();
  const { name, product, cogs, currency, qty, contact, status, notes } = await req.json();
  const rows = await sql`
    INSERT INTO public.suppliers (name, product, cogs, currency, qty, contact, status, notes)
    VALUES (${name}, ${product}, ${cogs}, ${currency}, ${qty}, ${contact}, ${status}, ${notes})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});