export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, requireManager, apiHandler } from '@/lib/api-auth';
import { z } from 'zod';

const createAssignmentSchema = z.object({
  asset_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role_in_metric: z.enum(['owner', 'contributor', 'reviewer']).default('contributor'),
});

// GET /api/metric-assignments — get assignments
// ?user_id=UUID or ?asset_id=UUID for filtering
export const GET = apiHandler(async (req) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const assetId = searchParams.get('asset_id');

  if (assetId) {
    const rows = await sql`
      SELECT ma.*, p.full_name, p.email, p.role as user_role
      FROM public.metric_assignments ma
      JOIN public.profiles p ON p.id = ma.user_id
      WHERE ma.asset_id = ${assetId}
      ORDER BY ma.role_in_metric ASC
    `;
    return NextResponse.json(rows);
  }

  if (userId) {
    const rows = await sql`
      SELECT ma.*, a.category, a.metric, a.value, a.direction, a.tracking, a.department_id
      FROM public.metric_assignments ma
      JOIN public.assets a ON a.id = ma.asset_id
      WHERE ma.user_id = ${userId}
      ORDER BY a.sort_order ASC
    `;
    return NextResponse.json(rows);
  }

  // Default: return own assignments
  const rows = await sql`
    SELECT ma.*, a.category, a.metric, a.value, a.direction, a.tracking, a.department_id
    FROM public.metric_assignments ma
    JOIN public.assets a ON a.id = ma.asset_id
    WHERE ma.user_id = ${user.id}
    ORDER BY a.sort_order ASC
  `;
  return NextResponse.json(rows);
});

// POST /api/metric-assignments — create assignment (manager+)
export const POST = apiHandler(async (req) => {
  const user = await requireManager();
  const raw = await req.json();
  const parsed = createAssignmentSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { asset_id, user_id, role_in_metric } = parsed.data;

  const rows = await sql`
    INSERT INTO public.metric_assignments (asset_id, user_id, role_in_metric, assigned_by)
    VALUES (${asset_id}, ${user_id}, ${role_in_metric}, ${user.id})
    ON CONFLICT (asset_id, user_id) DO UPDATE SET role_in_metric = ${role_in_metric}
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});

// DELETE /api/metric-assignments — remove assignment (manager+)
export const DELETE = apiHandler(async (req) => {
  await requireManager();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  await sql`DELETE FROM public.metric_assignments WHERE id = ${id}`;
  return NextResponse.json({ success: true });
});
