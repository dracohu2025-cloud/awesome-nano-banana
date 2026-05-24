import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export type AnalyticsEvent = {
  type: 'pageview';
  path: string;
  ts: string;
  referrer?: string;
  device?: 'desktop' | 'mobile' | 'bot' | 'unknown';
  country?: string;
};

export type AnalyticsDimension = {
  label: string;
  count: number;
};

export type AnalyticsSummary = {
  totalPageviews: number;
  uniquePaths: number;
  topPaths: AnalyticsDimension[];
  referrers: AnalyticsDimension[];
  devices: AnalyticsDimension[];
  countries: AnalyticsDimension[];
  recentEvents: AnalyticsEvent[];
  storageMode: 'blob' | 'local';
};

type SanitizeContext = {
  now?: Date;
  userAgent?: string | null;
  country?: string | null;
};

const DEFAULT_BLOB_PATH = 'analytics/events.jsonl';

function storageMode(): 'blob' | 'local' {
  return process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : 'local';
}

function localJsonlPath(): string {
  if (process.env.ANALYTICS_JSONL_PATH) return process.env.ANALYTICS_JSONL_PATH;
  if (process.env.VERCEL) return path.join('/tmp', 'awesome-nano-banana-analytics.jsonl');
  return path.join(process.cwd(), '.data', 'analytics', 'events.jsonl');
}

function normalizePath(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return '/';

  try {
    const raw = value.trim();
    const url = raw.startsWith('http://') || raw.startsWith('https://')
      ? new URL(raw)
      : new URL(raw, 'https://local.invalid');

    return url.pathname || '/';
  } catch {
    return '/';
  }
}

function normalizeReferrer(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.trim() === '') return undefined;

  try {
    const hostname = new URL(value.trim()).hostname.replace(/^www\./, '');
    return hostname || undefined;
  } catch {
    return undefined;
  }
}

function detectDevice(userAgent: string | null | undefined): AnalyticsEvent['device'] {
  const ua = (userAgent || '').toLowerCase();
  if (!ua) return 'unknown';
  if (/(bot|crawler|spider|crawling)/.test(ua)) return 'bot';
  if (/(mobile|iphone|android|ipad)/.test(ua)) return 'mobile';
  return 'desktop';
}

function normalizeCountry(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const country = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : undefined;
}

export function sanitizeAnalyticsInput(
  input: unknown,
  context: SanitizeContext = {},
): AnalyticsEvent {
  const data = input && typeof input === 'object' ? input as Record<string, unknown> : {};

  return {
    type: 'pageview',
    path: normalizePath(data.path),
    referrer: normalizeReferrer(data.referrer),
    device: detectDevice(context.userAgent),
    country: normalizeCountry(context.country),
    ts: (context.now || new Date()).toISOString(),
  };
}

function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<AnalyticsEvent>;
  return event.type === 'pageview'
    && typeof event.path === 'string'
    && typeof event.ts === 'string'
    && !Number.isNaN(Date.parse(event.ts));
}

export function parseAnalyticsJsonl(jsonl: string): AnalyticsEvent[] {
  return jsonl
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      try {
        const event = JSON.parse(line);
        return isAnalyticsEvent(event) ? [event] : [];
      } catch {
        return [];
      }
    });
}

function countBy(
  events: AnalyticsEvent[],
  getLabel: (event: AnalyticsEvent) => string | undefined,
): AnalyticsDimension[] {
  const counts = new Map<string, number>();

  for (const event of events) {
    const label = getLabel(event);
    if (!label) continue;
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function summarizeAnalyticsEvents(events: AnalyticsEvent[]): AnalyticsSummary {
  const recentEvents = [...events]
    .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))
    .slice(0, 20);

  return {
    totalPageviews: events.length,
    uniquePaths: new Set(events.map((event) => event.path)).size,
    topPaths: countBy(events, (event) => event.path).slice(0, 10),
    referrers: countBy(events, (event) => event.referrer).slice(0, 10),
    devices: countBy(events, (event) => event.device).slice(0, 10),
    countries: countBy(events, (event) => event.country).slice(0, 10),
    recentEvents,
    storageMode: storageMode(),
  };
}

export function serializeAnalyticsEvent(event: AnalyticsEvent): string {
  return `${JSON.stringify(event)}\n`;
}

async function readLocalJsonl(): Promise<string> {
  try {
    return await readFile(localJsonlPath(), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw error;
  }
}

async function appendLocalJsonl(line: string): Promise<void> {
  const filePath = localJsonlPath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await appendFile(filePath, line, 'utf8');
}

async function readBlobJsonl(): Promise<string> {
  const { get } = await import('@vercel/blob');

  try {
    const result = await get(process.env.ANALYTICS_BLOB_PATH || DEFAULT_BLOB_PATH, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      useCache: false,
    });

    if (!result || result.statusCode === 304) return '';
    return await new Response(result.stream).text();
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('404') || message.includes('not found')) return '';
    throw error;
  }
}

async function writeBlobJsonl(jsonl: string): Promise<void> {
  const { put } = await import('@vercel/blob');

  await put(process.env.ANALYTICS_BLOB_PATH || DEFAULT_BLOB_PATH, jsonl, {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/x-ndjson',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}

async function readAnalyticsJsonl(): Promise<string> {
  if (storageMode() === 'blob') return readBlobJsonl();
  return readLocalJsonl();
}

export async function appendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  const line = serializeAnalyticsEvent(event);

  if (storageMode() === 'blob') {
    const current = await readBlobJsonl();
    await writeBlobJsonl(current + line);
    return;
  }

  await appendLocalJsonl(line);
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const jsonl = await readAnalyticsJsonl();
  return summarizeAnalyticsEvents(parseAnalyticsJsonl(jsonl));
}
