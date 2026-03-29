export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';

// GET /api/asset-daily-logs?asset_id=xxx  (optional — omit to get all logs for last 30 days)
export const GET = apiHandler(async (req) => {
  await requireAuth();
  const { searchParams } = new URL(req.url);
  const assetId = searchParams.get('asset_id');

  let rows;
  if (assetId) {
    rows = await sql`
      SELECT * FROM public.asset_daily_logs
      WHERE asset_id = ${assetId}
        AND date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY date ASC
    `;
  } else {
    rows = await sql`
      SELECT * FROM public.asset_daily_logs
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY date ASC
    `;
  }
  return NextResponse.json(rows);
});

// POST /api/asset-daily-logs  — upsert: if entry exists for asset_id+date, update it
export const POST = apiHandler(async (req) => {
  await requireAuth();
  const body = await req.json();
  const { asset_id, date, value } = body;

  if (!asset_id || !date) {
    return NextResponse.json({ error: 'asset_id and date are required' }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO public.asset_daily_logs (asset_id, date, value)
    VALUES (${asset_id}, ${date}, ${value ?? 0})
    ON CONFLICT (asset_id, date) DO UPDATE SET value = ${value ?? 0}
    RETURNING *
  `;
  return NextResponse.json(rows[0], { status: 201 });
});
