import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

// ─── Role hierarchy: super_admin > admin > manager > lead > member ──────────

export function isLeadOrAbove(role: string): boolean {
  return role === 'lead' || role === 'manager' || role === 'admin' || role === 'super_admin';
}

export function isManagerOrAbove(role: string): boolean {
  return role === 'manager' || role === 'admin' || role === 'super_admin';
}

export function isAdminOrAbove(role: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function isSuperAdmin(role: string): boolean {
  return role === 'super_admin';
}

// ─── Role requirement functions ─────────────────────────────────────────────

export async function requireLead() {
  const user = await requireAuth();
  if (!isLeadOrAbove(user.role)) {
    throw new Error('Forbidden: lead or above only');
  }
  return user;
}

export async function requireManager() {
  const user = await requireAuth();
  if (!isManagerOrAbove(user.role)) {
    throw new Error('Forbidden: manager or above only');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (!isAdminOrAbove(user.role)) {
    throw new Error('Forbidden: admin only');
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();
  if (!isSuperAdmin(user.role)) {
    throw new Error('Forbidden: super_admin only');
  }
  return user;
}

export async function requireDeptAccess(deptId: string) {
  const user = await requireAuth();
  // Manager+ can access all departments
  if (isManagerOrAbove(user.role)) return user;
  // Dashboard is always accessible
  if (deptId === 'dashboard') return user;
  // Lead and member: check department assignment
  const depts = user.departments.split(',').map((d: string) => d.trim()).filter(Boolean);
  if (!depts.includes(deptId)) {
    throw new Error(`Forbidden: no access to ${deptId}`);
  }
  return user;
}

// ─── API handler wrapper ────────────────────────────────────────────────────

export function apiHandler(
  handler: (req: Request, context?: any) => Promise<Response>
) {
  return async (req: Request, context?: any) => {
    try {
      return await handler(req, context);
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message?.startsWith('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      console.error('API error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
