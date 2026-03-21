import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireDeptAccess, apiHandler } from '@/lib/api-auth';

// GET /api/expenses?deptId=shopify
export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get('deptId') || '';

  await requireDeptAccess(deptId);

  const rows = await sql`
    SELECT * FROM public.expenses
    WHERE department_id = ${deptId}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
});

// POST /api/expenses
export const POST = apiHandler(async (req) => {
  const body = await req.json();
  const { department_id, date, description, category, amount, currency, paid_by } = body;

  const user = await requireDeptAccess(department_id);

  const rows = await sql`
    INSERT INTO public.expenses (department_id, date, description, category, amount, currency, paid_by, created_by)
    VALUES (${department_id}, ${date}, ${description}, ${category}, ${amount}, ${currency}, ${paid_by}, ${user.id})
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});