import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

// Required — this route uses headers() via requireAuth, so it can't be statically rendered
export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (req) => {
  await requireAuth();

  const { searchParams } = new URL(req.url);
  const table = searchParams.get('table');
  const filterColumn = searchParams.get('filterColumn');
  const filterValue = searchParams.get('filterValue');
  const single = searchParams.get('single') === 'true';

  if (!table) {
    return NextResponse.json({ error: 'table is required' }, { status: 400 });
  }

  const allowedTables = [
    'revenue', 'expenses', 'tasks', 'department_notes',
    'gmb_listings', 'influencers', 'suppliers', 'team_members',
    'department_team_members', 'exchange_rates', 'departments', 'profiles',
  ];

  if (!allowedTables.includes(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 403 });
  }

  let rows: any[];

  if (filterColumn === 'department_id' && filterValue) {
    if (table === 'revenue') {
      rows = await sql`SELECT * FROM public.revenue WHERE department_id = ${filterValue} ORDER BY created_at ASC`;
    } else if (table === 'expenses') {
      rows = await sql`SELECT * FROM public.expenses WHERE department_id = ${filterValue} ORDER BY created_at ASC`;
    } else if (table === 'tasks') {
      rows = await sql`SELECT * FROM public.tasks WHERE department_id = ${filterValue} ORDER BY created_at ASC`;
    } else if (table === 'department_notes') {
      rows = await sql`SELECT * FROM public.department_notes WHERE department_id = ${filterValue}`;
    } else if (table === 'department_team_members') {
      rows = await sql`SELECT * FROM public.department_team_members WHERE department_id = ${filterValue} ORDER BY sort_order ASC`;
    } else {
      rows = [];
    }
  } else {
    if (table === 'revenue') {
      rows = await sql`SELECT * FROM public.revenue ORDER BY created_at ASC`;
    } else if (table === 'expenses') {
      rows = await sql`SELECT * FROM public.expenses ORDER BY created_at ASC`;
    } else if (table === 'tasks') {
      rows = await sql`SELECT * FROM public.tasks ORDER BY created_at ASC`;
    } else if (table === 'gmb_listings') {
      rows = await sql`SELECT * FROM public.gmb_listings ORDER BY created_at ASC`;
    } else if (table === 'influencers') {
      rows = await sql`SELECT * FROM public.influencers ORDER BY created_at ASC`;
    } else if (table === 'suppliers') {
      rows = await sql`SELECT * FROM public.suppliers ORDER BY created_at ASC`;
    } else if (table === 'team_members') {
      rows = await sql`SELECT * FROM public.team_members ORDER BY created_at ASC`;
    } else if (table === 'department_team_members') {
      rows = await sql`SELECT * FROM public.department_team_members ORDER BY sort_order ASC`;
    } else if (table === 'exchange_rates') {
      rows = await sql`SELECT * FROM public.exchange_rates WHERE id = 1`;
    } else if (table === 'departments') {
      rows = await sql`SELECT * FROM public.departments ORDER BY sort_order ASC`;
    } else if (table === 'profiles') {
      rows = await sql`SELECT id, email, full_name, role, created_at FROM public.profiles ORDER BY created_at ASC`;
    } else if (table === 'department_notes') {
      rows = await sql`SELECT * FROM public.department_notes ORDER BY updated_at DESC`;
    } else {
      rows = [];
    }
  }

  if (single) {
    return NextResponse.json(rows[0] || null);
  }

  return NextResponse.json(rows);
});