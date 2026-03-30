export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

// GET /api/audit-logs?limit=100&offset=0&action=login&entity_type=expense
export const GET = apiHandler(async (req) => {
  const user = await requireAuth();
  if (user.role !== 'super_admin') {
    throw new Error('Forbidden: super_admin only');
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);
  const offset = Number(searchParams.get('offset')) || 0;
  const action = searchParams.get('action');
  const entityType = searchParams.get('entity_type');
  const userId = searchParams.get('user_id');

  try {
    // Build query based on filters
    let rows;
    if (action && entityType) {
      rows = await sql`
        SELECT * FROM public.audit_logs
        WHERE action = ${action} AND entity_type = ${entityType}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (action) {
      rows = await sql`
        SELECT * FROM public.audit_logs
        WHERE action = ${action}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (entityType) {
      rows = await sql`
        SELECT * FROM public.audit_logs
        WHERE entity_type = ${entityType}
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (userId) {
      rows = await sql`
        SELECT * FROM public.audit_logs
        WHERE user_id = ${userId}::uuid
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      rows = await sql`
        SELECT * FROM public.audit_logs
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
      `;
    }

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('Audit logs query error:', err?.message || err);
    // Table might not exist yet
    if (err?.message?.includes('does not exist') || err?.message?.includes('relation')) {
      return NextResponse.json([], { status: 200 });
    }
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
});

// POST /api/audit-logs — logs an action (any authenticated user)
export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const body = await req.json();
  const { action, entity_type, entity_id, details } = body;

  try {
    await sql`
      INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
      VALUES (${user.id}, ${user.email}, ${action}, ${entity_type || ''}, ${entity_id || ''}, ${JSON.stringify(details || {})})
    `;
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error('Audit log insert error:', err?.message || err);
    // Don't fail the whole request if audit logging fails
    return NextResponse.json({ success: false, error: err?.message }, { status: 200 });
  }
});
