import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, isManagerOrAbove, apiHandler } from '@/lib/api-auth';

// PATCH /api/checkins/[id] — update check-in (AI results or leader review)
export const PATCH = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireAuth();
  const body = await req.json();

  // Get the check-in
  const existing = await sql`
    SELECT * FROM public.daily_checkins WHERE id = ${params.id} LIMIT 1
  `;
  if (!existing[0]) {
    return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
  }

  const checkin = existing[0];

  // Only the owner or manager+ can update
  if (checkin.user_id !== user.id && !isManagerOrAbove(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date().toISOString();

  // AI processing update (from the parse endpoint)
  if (body.ai_summary !== undefined) {
    const rows = await sql`
      UPDATE public.daily_checkins
      SET ai_summary = ${body.ai_summary || ''},
          ai_extracted_metrics = ${JSON.stringify(body.ai_extracted_metrics || [])},
          ai_confidence_score = ${body.ai_confidence_score || 0},
          ai_flags = ${JSON.stringify(body.ai_flags || [])},
          status = 'ai_processed',
          processed_at = ${now}
      WHERE id = ${params.id}
      RETURNING *
    `;
    return NextResponse.json(rows[0]);
  }

  // Leader review update
  if (body.reviewer_notes !== undefined && isManagerOrAbove(user.role)) {
    const rows = await sql`
      UPDATE public.daily_checkins
      SET reviewed_by = ${user.id},
          reviewer_notes = ${body.reviewer_notes || ''},
          status = 'reviewed'
      WHERE id = ${params.id}
      RETURNING *
    `;
    return NextResponse.json(rows[0]);
  }

  return NextResponse.json({ error: 'No valid update fields' }, { status: 400 });
});
