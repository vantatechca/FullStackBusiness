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

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Forbidden: admin only');
  }
  return user;
}

export async function requireDeptAccess(deptId: string) {
  const user = await requireAuth();
  if (user.role === 'admin') return user;
  if (deptId === 'dashboard') return user;
  const depts = user.departments.split(',').map((d: string) => d.trim()).filter(Boolean);
  if (!depts.includes(deptId)) {
    throw new Error(`Forbidden: no access to ${deptId}`);
  }
  return user;
}

// Wrap API route handlers with error handling
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