export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler, isAdminOrAbove } from '@/lib/api-auth';

export const GET = apiHandler(async () => {
  const user = await requireAuth();

  // Check if user is super_admin or a starred admin
  const isSuperAdminUser = user.role === 'super_admin';
  let isStarred = false;

  if (!isSuperAdminUser) {
    if (!isAdminOrAbove(user.role)) {
      return NextResponse.json([]);
    }
    const starred = await sql`
      SELECT id FROM public.birthday_starred_admins WHERE admin_id = ${user.id}
    `;
    isStarred = starred.length > 0;
    if (!isStarred) {
      return NextResponse.json([]);
    }
  }

  const currentYear = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all partners with birthdays
  const partners = await sql`
    SELECT bp.*,
      bd_greeted.id AS greeted_id,
      bd_snoozed.id AS snoozed_id,
      bd_snoozed.snoozed_until
    FROM public.business_partners bp
    LEFT JOIN public.birthday_dismissals bd_greeted
      ON bd_greeted.partner_id = bp.id
      AND bd_greeted.user_id = ${user.id}
      AND bd_greeted.year = ${currentYear}
      AND bd_greeted.action = 'greeted'
    LEFT JOIN public.birthday_dismissals bd_snoozed
      ON bd_snoozed.partner_id = bp.id
      AND bd_snoozed.user_id = ${user.id}
      AND bd_snoozed.year = ${currentYear}
      AND bd_snoozed.action = 'snoozed'
    WHERE bp.birthday IS NOT NULL
    ORDER BY bp.name ASC
  `;

  // Filter to birthdays within +/- 7 days window and not yet greeted
  const now = new Date();
  const results = partners
    .filter((p: any) => {
      if (!p.birthday) return false;
      // Already greeted this year
      if (p.greeted_id) return false;
      // Snoozed and not yet due
      if (p.snoozed_id && p.snoozed_until) {
        const snoozeEnd = new Date(p.snoozed_until);
        if (now < snoozeEnd) return false;
      }

      const bday = new Date(p.birthday);
      const thisYearBday = new Date(currentYear, bday.getUTCMonth(), bday.getUTCDate());
      const diffMs = thisYearBday.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      // Show birthdays from 3 days before to 7 days after
      return diffDays >= -3 && diffDays <= 7;
    })
    .map((p: any) => {
      const bday = new Date(p.birthday);
      const thisYearBday = new Date(currentYear, bday.getUTCMonth(), bday.getUTCDate());
      const diffMs = thisYearBday.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return {
        id: p.id,
        name: p.name,
        birthday: p.birthday,
        days_until: diffDays,
        is_today: diffDays === 0,
      };
    });

  return NextResponse.json(results);
});
