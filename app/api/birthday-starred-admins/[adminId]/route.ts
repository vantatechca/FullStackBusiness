export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSuperAdmin, apiHandler } from '@/lib/api-auth';

// Unstar an admin
export const DELETE = apiHandler(async (_req, { params }: { params: { adminId: string } }) => {
  await requireSuperAdmin();
  const { adminId } = await params;
  await sql`DELETE FROM public.birthday_starred_admins WHERE admin_id = ${adminId}`;
  return NextResponse.json({ ok: true });
});
