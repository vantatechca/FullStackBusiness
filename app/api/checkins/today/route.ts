export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  // Get today's check-in for this user (if any)
  const checkins = await sql`
    SELECT * FROM public.daily_checkins
    WHERE user_id = ${user.id} AND checkin_date = CURRENT_DATE
    LIMIT 1
  `;

  // Get user's metric assignments with asset details
  const assignments = await sql`
    SELECT ma.id, ma.role_in_metric, ma.asset_id,
           a.category, a.metric, a.value, a.previous_value,
           a.direction, a.tracking, a.department_id
    FROM public.metric_assignments ma
    JOIN public.assets a ON a.id = ma.asset_id
    WHERE ma.user_id = ${user.id}
    ORDER BY a.sort_order ASC
  `;

  return NextResponse.json({
    checkin: checkins[0] || null,
    assignments,
    hasCheckedIn: !!checkins[0] && checkins[0].status !== 'pending',
  });
});
