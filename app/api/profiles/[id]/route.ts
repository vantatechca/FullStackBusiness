import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requireAdmin, isSuperAdmin, apiHandler } from '@/lib/api-auth';
import { logAuditServer } from '@/lib/audit-server';

// GET /api/profiles/[id] — admin+ can view any user
export const GET = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  await requireAdmin();

  const rows = await sql`
    SELECT id, email, full_name, role, created_at FROM public.profiles
    WHERE id = ${params.id}
  `;

  if (!rows[0]) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
});

// PATCH /api/profiles/[id] — admin+ updates user (role, name, email, password)
export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireAdmin();
  const body = await req.json();
  const { role, full_name, email, password } = body;

  // Only super_admin can assign admin/super_admin roles
  if (role && (role === 'super_admin' || role === 'admin') && !isSuperAdmin(user.role)) {
    return NextResponse.json({ error: 'Only super admins can assign admin roles' }, { status: 403 });
  }

  if (role && !['super_admin', 'admin', 'manager', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Build dynamic update
  const updates: string[] = [];
  const details: Record<string, string> = {};

  if (role) { details.new_role = role; }
  if (full_name) { details.new_name = full_name; }
  if (email) { details.new_email = email; }
  if (password) { details.password_changed = 'true'; }

  // Use a single query with COALESCE to only update provided fields
  const password_hash = password ? await bcrypt.hash(password, 12) : null;

  const rows = password_hash
    ? await sql`
        UPDATE public.profiles
        SET role = COALESCE(${role || null}, role),
            full_name = COALESCE(${full_name || null}, full_name),
            email = COALESCE(${email || null}, email),
            password_hash = ${password_hash}
        WHERE id = ${params.id}
        RETURNING id, email, full_name, role, created_at
      `
    : await sql`
        UPDATE public.profiles
        SET role = COALESCE(${role || null}, role),
            full_name = COALESCE(${full_name || null}, full_name),
            email = COALESCE(${email || null}, email)
        WHERE id = ${params.id}
        RETURNING id, email, full_name, role, created_at
      `;

  if (!rows[0]) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  logAuditServer(user.id, user.email, 'update', 'user', params.id, details);
  return NextResponse.json(rows[0]);
});

// DELETE /api/profiles/[id] — admin+ deletes user
export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireAdmin();

  // Prevent deleting yourself
  if (params.id === user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  // Check target user's role — only super_admin can delete admin/super_admin
  const target = await sql`SELECT role FROM public.profiles WHERE id = ${params.id}`;
  if (target.length > 0 && (target[0].role === 'admin' || target[0].role === 'super_admin') && !isSuperAdmin(user.role)) {
    return NextResponse.json({ error: 'Only super admins can delete admin users' }, { status: 403 });
  }

  await sql`DELETE FROM public.profiles WHERE id = ${params.id}`;
  logAuditServer(user.id, user.email, 'delete', 'user', params.id);
  return NextResponse.json({ success: true });
});
