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

  let rows;
  if (action && entityType && userId) {
    rows = await sql`
      SELECT * FROM public.audit_logs
      WHERE action = ${action} AND entity_type = ${entityType} AND user_id = ${userId}::uuid
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (action && entityType) {
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
});

// POST /api/audit-logs — internal use, logs an action
export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const body = await req.json();
  const { action, entity_type, entity_id, details } = body;

  await sql`
    INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
    VALUES (${user.id}, ${user.email}, ${action}, ${entity_type || ''}, ${entity_id || ''}, ${JSON.stringify(details || {})})
  `;

  return NextResponse.json({ success: true }, { status: 201 });
});
