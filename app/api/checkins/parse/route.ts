import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAuth, apiHandler } from '@/lib/api-auth';
import { z } from 'zod';

const parseSchema = z.object({
  checkin_id: z.string().uuid(),
  raw_response: z.string().min(1),
});

// POST /api/checkins/parse — send check-in to AI for metric extraction
export const POST = apiHandler(async (req) => {
  const user = await requireAuth();
  const raw = await req.json();
  const parsed = parseSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { checkin_id, raw_response } = parsed.data;

  // Verify check-in belongs to user
  const checkin = await sql`
    SELECT * FROM public.daily_checkins
    WHERE id = ${checkin_id} AND user_id = ${user.id}
    LIMIT 1
  `;
  if (!checkin[0]) {
    return NextResponse.json({ error: 'Check-in not found' }, { status: 404 });
  }

  // Get user's metric assignments with current values
  const assignments = await sql`
    SELECT ma.asset_id, ma.role_in_metric,
           a.category, a.metric, a.value, a.previous_value,
           a.direction, a.tracking
    FROM public.metric_assignments ma
    JOIN public.assets a ON a.id = ma.asset_id
    WHERE ma.user_id = ${user.id}
    ORDER BY a.sort_order ASC
  `;

  // If no ANTHROPIC_API_KEY, return a structured fallback
  if (!process.env.ANTHROPIC_API_KEY) {
    const fallback = {
      ai_summary: 'AI parsing unavailable — no API key configured. Please confirm your metrics manually.',
      ai_extracted_metrics: [] as any[],
      ai_confidence_score: 0,
      ai_flags: [{ description: 'AI parsing not configured. Set ANTHROPIC_API_KEY to enable.', severity: 'low' }],
    };

    // Still save the result to the check-in
    await sql`
      UPDATE public.daily_checkins
      SET ai_summary = ${fallback.ai_summary},
          ai_extracted_metrics = ${JSON.stringify(fallback.ai_extracted_metrics)},
          ai_confidence_score = ${fallback.ai_confidence_score},
          ai_flags = ${JSON.stringify(fallback.ai_flags)},
          status = 'ai_processed',
          processed_at = ${new Date().toISOString()}
      WHERE id = ${checkin_id}
    `;

    return NextResponse.json(fallback);
  }

  // Build the context for AI
  const metricsContext = assignments.map((a: any) => ({
    asset_id: a.asset_id,
    category: a.category,
    metric_name: a.metric,
    current_value: Number(a.value),
    previous_value: Number(a.previous_value),
    direction: a.direction === 'up_good' ? 'higher is better' : 'lower is better',
    tracking: a.tracking,
  }));

  const systemPrompt = `You are a Business Hub check-in analyzer. A team member has submitted their daily report. Your job is to:

1. Extract any metric updates mentioned. Return as JSON array with fields: asset_id, metric_name, new_value (the absolute new value), delta (the change amount, positive or negative), confidence (0.0-1.0).
2. Identify blockers or issues. Return as JSON array with fields: description, severity (low/medium/high).
3. Generate a 1-2 sentence summary of what they accomplished.

The team member is responsible for these metrics:
${JSON.stringify(metricsContext, null, 2)}

IMPORTANT RULES:
- Only extract metrics the member actually mentioned numbers for.
- If a metric change is ambiguous, set confidence below 0.7.
- Never invent numbers the member did not mention.
- For "daily" tracking metrics, the reported number IS the new_value (not added to current).
- For "total" tracking metrics, calculate new_value = current_value + delta.
- Always return valid JSON in the exact format specified.

Return your response as a JSON object with exactly these keys:
{
  "summary": "1-2 sentence summary",
  "extracted_metrics": [{ "asset_id": "...", "metric_name": "...", "new_value": number, "delta": number, "confidence": number }],
  "flags": [{ "description": "...", "severity": "low|medium|high" }]
}`;

  const userMessage = `Here is the team member's daily check-in response:\n\n"${raw_response}"`;

  try {
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} ${err}`);
    }

    const aiData = await aiResponse.json();
    const aiText = aiData.content?.[0]?.text || '{}';

    // Parse the AI response - handle markdown code blocks
    let aiResult: { summary?: string; extracted_metrics?: any[]; flags?: any[] };
    try {
      const cleaned = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResult = JSON.parse(cleaned);
    } catch {
      aiResult = { summary: aiText, extracted_metrics: [], flags: [{ description: 'AI response was not valid JSON', severity: 'medium' }] };
    }

    const result = {
      ai_summary: aiResult.summary || '',
      ai_extracted_metrics: aiResult.extracted_metrics || [],
      ai_confidence_score: aiResult.extracted_metrics?.length
        ? aiResult.extracted_metrics.reduce((sum: number, m: any) => sum + (m.confidence || 0), 0) / aiResult.extracted_metrics.length
        : 0,
      ai_flags: aiResult.flags || [],
    };

    // Save to check-in
    await sql`
      UPDATE public.daily_checkins
      SET ai_summary = ${result.ai_summary},
          ai_extracted_metrics = ${JSON.stringify(result.ai_extracted_metrics)},
          ai_confidence_score = ${result.ai_confidence_score},
          ai_flags = ${JSON.stringify(result.ai_flags)},
          status = 'ai_processed',
          processed_at = ${new Date().toISOString()}
      WHERE id = ${checkin_id}
    `;

    return NextResponse.json(result);
  } catch (err: any) {
    // On AI failure, still mark as processed so user can manually confirm
    const fallback = {
      ai_summary: 'AI processing failed. Please confirm your metrics manually.',
      ai_extracted_metrics: [],
      ai_confidence_score: 0,
      ai_flags: [{ description: `AI error: ${err.message}`, severity: 'medium' }],
    };

    await sql`
      UPDATE public.daily_checkins
      SET ai_summary = ${fallback.ai_summary},
          ai_extracted_metrics = ${JSON.stringify(fallback.ai_extracted_metrics)},
          ai_confidence_score = ${fallback.ai_confidence_score},
          ai_flags = ${JSON.stringify(fallback.ai_flags)},
          status = 'ai_processed',
          processed_at = ${new Date().toISOString()}
      WHERE id = ${checkin_id}
    `;

    return NextResponse.json(fallback);
  }
});
