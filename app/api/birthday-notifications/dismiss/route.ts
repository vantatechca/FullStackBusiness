export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const { partner_id, action } = await req.json();

  if (!partner_id || !['greeted', 'snoozed'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const currentYear = new Date().getFullYear();

  if (action === 'greeted') {
    // Mark as greeted for this year — won't show again
    await sql`
      INSERT INTO public.birthday_dismissals (partner_id, user_id, action, year)
      VALUES (${partner_id}, ${user.id}, 'greeted', ${currentYear})
      ON CONFLICT (partner_id, user_id, year, action) DO NOTHING
    `;
  } else {
    // Snooze for 90 minutes
    const snoozedUntil = new Date(Date.now() + 90 * 60 * 1000).toISOString();
    await sql`
      INSERT INTO public.birthday_dismissals (partner_id, user_id, action, year, snoozed_until)
      VALUES (${partner_id}, ${user.id}, 'snoozed', ${currentYear}, ${snoozedUntil})
      ON CONFLICT (partner_id, user_id, year, action)
      DO UPDATE SET snoozed_until = ${snoozedUntil}
    `;
  }

  return NextResponse.json({ ok: true });
});
