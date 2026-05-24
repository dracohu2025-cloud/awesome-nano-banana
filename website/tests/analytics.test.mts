import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAnalyticsJsonl,
  sanitizeAnalyticsInput,
  summarizeAnalyticsEvents,
} from '../src/lib/analytics.ts';

test('sanitizeAnalyticsInput keeps only safe pageview fields', () => {
  const event = sanitizeAnalyticsInput(
    {
      type: 'pageview',
      path: 'https://banana.aigc.green/case/example?x=1',
      referrer: 'https://example.com/some/article?utm=1',
    },
    {
      now: new Date('2026-05-24T08:00:00.000Z'),
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      country: 'US',
    },
  );

  assert.equal(event.type, 'pageview');
  assert.equal(event.path, '/case/example');
  assert.equal(event.referrer, 'example.com');
  assert.equal(event.device, 'mobile');
  assert.equal(event.country, 'US');
  assert.equal(event.ts, '2026-05-24T08:00:00.000Z');
});

test('parseAnalyticsJsonl ignores malformed lines', () => {
  const events = parseAnalyticsJsonl([
    '{"type":"pageview","path":"/","ts":"2026-05-24T08:00:00.000Z","device":"desktop"}',
    'not json',
    '{"type":"click","path":"/case/a","ts":"2026-05-24T08:01:00.000Z"}',
    '',
  ].join('\n'));

  assert.equal(events.length, 1);
  assert.equal(events[0].path, '/');
});

test('summarizeAnalyticsEvents returns totals and top dimensions', () => {
  const summary = summarizeAnalyticsEvents([
    { type: 'pageview', path: '/', ts: '2026-05-24T08:00:00.000Z', device: 'desktop' },
    { type: 'pageview', path: '/', ts: '2026-05-24T09:00:00.000Z', device: 'mobile', referrer: 'x.com' },
    { type: 'pageview', path: '/case/a', ts: '2026-05-23T09:00:00.000Z', device: 'mobile', referrer: 'x.com' },
  ]);

  assert.equal(summary.totalPageviews, 3);
  assert.equal(summary.uniquePaths, 2);
  assert.deepEqual(summary.topPaths[0], { label: '/', count: 2 });
  assert.deepEqual(summary.referrers[0], { label: 'x.com', count: 2 });
  assert.deepEqual(summary.devices[0], { label: 'mobile', count: 2 });
  assert.equal(summary.recentEvents[0].path, '/');
});
