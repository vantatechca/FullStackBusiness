import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireDeptAccess, apiHandler } from '@/lib/api-auth';

// GET /api/revenue?deptId=shopify
export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get('deptId') || '';

  await requireDeptAccess(deptId);

  const rows = await sql`
    SELECT * FROM public.revenue
    WHERE department_id = ${deptId}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
});

// POST /api/revenue
export const POST = apiHandler(async (req) => {
  const body = await req.json();
  const { department_id, date, source, amount, currency, notes } = body;

  const user = await requireDeptAccess(department_id);

  const rows = await sql`
    INSERT INTO public.revenue (department_id, date, source, amount, currency, notes, created_by)
    VALUES (${department_id}, ${date}, ${source}, ${amount}, ${currency}, ${notes}, ${user.id})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});