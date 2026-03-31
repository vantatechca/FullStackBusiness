export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requireAuth, requireAdmin, isAdminOrAbove, isSuperAdmin, apiHandler } from '@/lib/api-auth';
import { logAuditServer } from '@/lib/audit-server';

// GET /api/profiles — admin+ gets all, user gets own
export const GET = apiHandler(async () => {
  const user = await requireAuth();

  if (isAdminOrAbove(user.role)) {
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

// POST /api/profiles — admin+ creates users with credentials
export const POST = apiHandler(async (req) => {
  const user = await requireAdmin();
  const { email, full_name, role, password } = await req.json();

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 });
  }

  const validRoles = ['super_admin', 'admin', 'manager', 'member'];
  if (!validRoles.includes(role || 'member')) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Only super_admin can create super_admin users
  if (role === 'super_admin' && !isSuperAdmin(user.role)) {
    return NextResponse.json({ error: 'Only super admins can assign the super admin role' }, { status: 403 });
  }

  // Check if email already exists
  const existing = await sql`SELECT id FROM public.profiles WHERE email = ${email} LIMIT 1`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const rows = await sql`
    INSERT INTO public.profiles (id, email, full_name, role, password_hash)
    VALUES (gen_random_uuid(), ${email}, ${full_name}, ${role || 'member'}, ${password_hash})
    RETURNING id, email, full_name, role, created_at
  `;
  logAuditServer(user.id, user.email, 'create', 'user', rows[0].id, { new_user_email: email, role: role || 'member' });
  return NextResponse.json(rows[0], { status: 201 });
});
