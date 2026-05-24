import { appendAnalyticsEvent, sanitizeAnalyticsInput } from '@/lib/analytics';
import { type NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const event = sanitizeAnalyticsInput(body, {
    userAgent: request.headers.get('user-agent'),
    country: request.headers.get('x-vercel-ip-country'),
  });

  await appendAnalyticsEvent(event);

  return Response.json({ ok: true });
}
