export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, isManagerOrAbove, apiHandler } from '@/lib/api-auth';
import { z } from 'zod';

const submitCheckinSchema = z.object({
  raw_response: z.string().min(1, 'Check-in response is required'),
  deferred: z.boolean().optional().default(false),
});

// GET /api/checkins — list check-ins (admin/manager sees all, others see own)
// Supports ?date=YYYY-MM-DD and ?user_id=UUID filters
export const GET = apiHandler(async (req) => {
  const user = await requireAuth();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const userId = searchParams.get('user_id');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  if (isManagerOrAbove(user.role)) {
    // Manager+ can see all check-ins, optionally filtered
    if (date && userId) {
      const rows = await sql`
        SELECT c.*, p.full_name, p.email, p.role as user_role
        FROM public.daily_checkins c
        JOIN public.profiles p ON p.id = c.user_id
        WHERE c.checkin_date = ${date} AND c.user_id = ${userId}
        ORDER BY c.submitted_at DESC
        LIMIT ${limit}
      `;
      return NextResponse.json(rows);
    }
    if (date) {
      const rows = await sql`
        SELECT c.*, p.full_name, p.email, p.role as user_role
        FROM public.daily_checkins c
        JOIN public.profiles p ON p.id = c.user_id
        WHERE c.checkin_date = ${date}
        ORDER BY c.submitted_at DESC
        LIMIT ${limit}
      `;
      return NextResponse.json(rows);
    }
    if (userId) {
      const rows = await sql`
        SELECT c.*, p.full_name, p.email, p.role as user_role
        FROM public.daily_checkins c
        JOIN public.profiles p ON p.id = c.user_id
        WHERE c.user_id = ${userId}
        ORDER BY c.checkin_date DESC
        LIMIT ${limit}
      `;
      return NextResponse.json(rows);
    }
    const rows = await sql`
      SELECT c.*, p.full_name, p.email, p.role as user_role
      FROM public.daily_checkins c
      JOIN public.profiles p ON p.id = c.user_id
      ORDER BY c.checkin_date DESC, c.submitted_at DESC
      LIMIT ${limit}
    `;
    return NextResponse.json(rows);
  }

  // Regular user: own check-ins only
  const rows = await sql`
    SELECT * FROM public.daily_checkins
    WHERE user_id = ${user.id}
    ORDER BY checkin_date DESC
    LIMIT ${limit}
  `;
  return NextResponse.json(rows);
});

// POST /api/checkins — submit today's check-in
export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const raw = await req.json();
  const parsed = submitCheckinSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { raw_response, deferred } = parsed.data;

  // Check if already submitted today
  const existing = await sql`
    SELECT id, status FROM public.daily_checkins
    WHERE user_id = ${user.id} AND checkin_date = CURRENT_DATE
    LIMIT 1
  `;

  if (existing[0] && existing[0].status !== 'pending') {
    return NextResponse.json({ error: 'Already checked in today' }, { status: 409 });
  }

  const now = new Date().toISOString();

  if (existing[0]) {
    // Update existing pending check-in
    const rows = await sql`
      UPDATE public.daily_checkins
      SET raw_response = ${raw_response},
          status = ${deferred ? 'pending' : 'submitted'},
          deferred = ${deferred},
          submitted_at = ${deferred ? null : now}
      WHERE id = ${existing[0].id}
      RETURNING *
    `;
    return NextResponse.json(rows[0]);
  }

  // Create new check-in
  const rows = await sql`
    INSERT INTO public.daily_checkins (user_id, raw_response, status, deferred, submitted_at)
    VALUES (${user.id}, ${raw_response}, ${deferred ? 'pending' : 'submitted'}, ${deferred}, ${deferred ? null : now})
    RETURNING *
  `;

  // Update last_checkin_at and streak on profile
  if (!deferred) {
    await sql`
      UPDATE public.profiles
      SET last_checkin_at = ${now},
          checkin_streak = CASE
            WHEN last_checkin_at::date = CURRENT_DATE - INTERVAL '1 day' THEN checkin_streak + 1
            WHEN last_checkin_at::date = CURRENT_DATE THEN checkin_streak
            ELSE 1
          END,
          longest_streak = GREATEST(longest_streak, CASE
            WHEN last_checkin_at::date = CURRENT_DATE - INTERVAL '1 day' THEN checkin_streak + 1
            ELSE 1
          END)
      WHERE id = ${user.id}
    `;
  }

  return NextResponse.json(rows[0], { status: 201 });
});
