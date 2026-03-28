import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, requireDeptAccess, apiHandler } from '@/lib/api-auth';

// GET /api/revenue?deptId=shopify  (deptId is optional — omit to get all revenue)
export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get('deptId');

  if (deptId) {
    await requireDeptAccess(deptId);
    const rows = await sql`
      SELECT * FROM public.revenue
      WHERE department_id = ${deptId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  }

  // No deptId — return all revenue (auth required)
  await requireAuth();
  const rows = await sql`
    SELECT * FROM public.revenue
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
});

// POST /api/revenue  (department_id is now optional)
export const POST = apiHandler(async (req) => {
  const body = await req.json();
  const { department_id, date, source, amount, currency, notes } = body;

  let user;
  if (department_id) {
    user = await requireDeptAccess(department_id);
  } else {
    user = await requireAuth();
  }

  const rows = await sql`
    INSERT INTO public.revenue (department_id, date, source, amount, currency, notes, created_by)
    VALUES (${department_id || null}, ${date}, ${source || ''}, ${amount}, ${currency || 'USD'}, ${notes || ''}, ${user.id})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});
