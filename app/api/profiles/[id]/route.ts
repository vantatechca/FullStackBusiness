import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireSuperAdmin, apiHandler } from '@/lib/api-auth';
import { logAuditServer } from '@/lib/audit-server';

// PATCH /api/profiles/[id] — super_admin updates role
export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireSuperAdmin();
  const { role } = await req.json();

  if (!['super_admin', 'admin', 'manager', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const rows = await sql`
    UPDATE public.profiles
    SET role = ${role}
    WHERE id = ${params.id}
    RETURNING id, email, full_name, role, created_at
  `;

  if (!rows[0]) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  logAuditServer(user.id, user.email, 'update', 'user', params.id, { new_role: role });
  return NextResponse.json(rows[0]);
});

// DELETE /api/profiles/[id] — super_admin deletes user
export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireSuperAdmin();

  // Prevent deleting yourself
  if (params.id === user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  await sql`DELETE FROM public.profiles WHERE id = ${params.id}`;
  logAuditServer(user.id, user.email, 'delete', 'user', params.id);
  return NextResponse.json({ success: true });
});
