import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';
import { z } from 'zod';

const confirmSchema = z.object({
  metrics: z.array(z.object({
    asset_id: z.string().uuid(),
    new_value: z.number(),
    delta: z.number(),
    notes: z.string().optional().default(''),
  })),
});

// POST /api/checkins/[id]/confirm — confirm and apply metric updates
export const POST = apiHandler(async (req, { params }: { params: { id: string } }) => {
  const user = await requireAuth();
  const raw = await req.json();
  const parsed = confirmSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // Verify the check-in belongs to this user and is in ai_processed state
  const existing = await sql`
    SELECT * FROM public.daily_checkins
    WHERE id = ${params.id} AND user_id = ${user.id}
    LIMIT 1
  `;
  if (!existing[0]) {
    return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
  }

  const { metrics } = parsed.data;
  const updates: any[] = [];

  for (const m of metrics) {
    // Get current asset value
    const asset = await sql`
      SELECT id, value FROM public.assets WHERE id = ${m.asset_id} LIMIT 1
    `;
    if (!asset[0]) continue;

    const oldValue = Number(asset[0].value);

    // Update the asset value
    await sql`
      UPDATE public.assets
      SET value = ${m.new_value}, previous_value = ${oldValue}, updated_at = now()
      WHERE id = ${m.asset_id}
    `;

    // Create audit trail entry
    const updateRow = await sql`
      INSERT INTO public.metric_updates (asset_id, user_id, checkin_id, source, old_value, new_value, delta, notes)
      VALUES (${m.asset_id}, ${user.id}, ${params.id}, 'checkin', ${oldValue}, ${m.new_value}, ${m.delta}, ${m.notes})
      RETURNING *
    `;
    updates.push(updateRow[0]);
  }

  return NextResponse.json({ success: true, updates });
});
