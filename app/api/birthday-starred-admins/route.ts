export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSuperAdmin, apiHandler } from '@/lib/api-auth';

// Get all starred admins
export const GET = apiHandler(async () => {
  await requireSuperAdmin();
  const rows = await sql`SELECT * FROM public.birthday_starred_admins`;
  return NextResponse.json(rows);
});

// Star an admin
export const POST = apiHandler(async (req) => {
  const user = await requireSuperAdmin();
  const { admin_id } = await req.json();

  if (!admin_id) {
    return NextResponse.json({ error: 'admin_id required' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO public.birthday_starred_admins (admin_id, starred_by)
    VALUES (${admin_id}, ${user.id})
    ON CONFLICT (admin_id) DO NOTHING
    RETURNING *
  `;
  return NextResponse.json(rows[0] || { admin_id }, { status: 201 });
});
