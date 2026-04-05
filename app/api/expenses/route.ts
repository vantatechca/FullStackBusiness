export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, requireDeptAccess, apiHandler } from '@/lib/api-auth';
import { logAuditServer } from '@/lib/audit-server';
import { createExpenseSchema } from '@/lib/validations';

// GET /api/expenses?deptId=shopify  (deptId is optional — omit to get all expenses)
export const GET = apiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get('deptId');

  if (deptId) {
    await requireDeptAccess(deptId);
    const rows = await sql`
      SELECT * FROM public.expenses
      WHERE department_id = ${deptId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows);
  }

  // No deptId — return all expenses (auth required)
  await requireAuth();
  const rows = await sql`
    SELECT * FROM public.expenses
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
});

// POST /api/expenses  (department_id is now optional)
export const POST = apiHandler(async (req) => {
  const raw = await req.json();
  const parsed = createExpenseSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  const { department_id, task_id, date, description, category, amount, currency, paid_by } = parsed.data;

  let user;
  if (department_id) {
    user = await requireDeptAccess(department_id);
  } else {
    user = await requireAuth();
  }

  const rows = await sql`
    INSERT INTO public.expenses (department_id, task_id, date, description, category, amount, currency, paid_by, created_by)
    VALUES (${department_id || null}, ${task_id || null}, ${date}, ${description}, ${category || ''}, ${amount}, ${currency || 'USD'}, ${paid_by || ''}, ${user.id})
    RETURNING *
  `;
  logAuditServer(user.id, user.email, 'create', 'expense', rows[0].id, { amount, category, description });
  return NextResponse.json(rows[0], { status: 201 });
});
