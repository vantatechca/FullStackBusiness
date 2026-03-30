export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';
import { logAuditServer } from '@/lib/audit-server';

export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireAuth();
  const body = await req.json();
  const hasDeptUpdate = 'department_id' in body;
  const rows = await sql`
    UPDATE public.assets
    SET
      category       = COALESCE(${body.category ?? null}, category),
      metric         = COALESCE(${body.metric ?? null}, metric),
      value          = COALESCE(${body.value ?? null}, value),
      previous_value = COALESCE(${body.previous_value ?? null}, previous_value),
      direction      = COALESCE(${body.direction ?? null}, direction),
      tracking       = COALESCE(${body.tracking ?? null}, tracking),
      sort_order     = COALESCE(${body.sort_order ?? null}, sort_order),
      notes          = COALESCE(${body.notes ?? null}, notes),
      department_id  = ${hasDeptUpdate ? (body.department_id || null) : sql`department_id`},
      updated_at     = now()
    WHERE id = ${params.id}
    RETURNING *
  `;
  logAuditServer(user.id, user.email, 'update', 'asset', params.id, { fields: Object.keys(body) });
  return NextResponse.json(rows[0]);
});

export const DELETE = apiHandler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireAuth();
  await sql`DELETE FROM public.assets WHERE id = ${params.id}`;
  logAuditServer(user.id, user.email, 'delete', 'asset', params.id);
  return NextResponse.json({ success: true });
});
