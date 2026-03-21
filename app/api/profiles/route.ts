import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requireAdmin, requireAuth, apiHandler } from '@/lib/api-auth';

// GET /api/profiles — admin gets all, user gets own
export const GET = apiHandler(async () => {
  const user = await requireAuth();

  if (user.role === 'admin') {
    const rows = await sql`
      SELECT id, email, full_name, role, created_at FROM public.profiles
      ORDER BY created_at ASC
    `;
    return NextResponse.json(rows);
  }

  const rows = await sql`
    SELECT id, email, full_name, role, created_at FROM public.profiles
    WHERE id = ${user.id}
  `;
  return NextResponse.json(rows[0]);
});

// POST /api/profiles — admin creates users
export const POST = apiHandler(async (req) => {
  await requireAdmin();
  const { email, full_name, role, password } = await req.json();

  const password_hash = await bcrypt.hash(password, 12);

  const rows = await sql`
    INSERT INTO public.profiles (email, full_name, role, password_hash)
    VALUES (${email}, ${full_name}, ${role}, ${password_hash})
    RETURNING id, email, full_name, role, created_at
  `;
  return NextResponse.json(rows[0], { status: 201 });
});