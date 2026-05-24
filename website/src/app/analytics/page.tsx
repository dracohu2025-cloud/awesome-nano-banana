import Header from '@/components/Header';
import { getAnalyticsSummary } from '@/lib/analytics';
import { Activity, BarChart3, Database, Globe2, MonitorSmartphone } from 'lucide-react';

export const dynamic = 'force-dynamic';

function StatBlock({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className={`neo-card p-5 ${accent}`}>
      <div className="text-xs font-black uppercase text-black/70">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

function DimensionList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  return (
    <section className="neo-card bg-white overflow-hidden">
      <div className="border-b-3 border-black bg-[var(--accent-yellow)] px-4 py-3">
        <h2 className="font-black uppercase">{title}</h2>
      </div>
      <div className="divide-y-3 divide-black">
        {items.length > 0 ? items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="truncate font-bold">{item.label}</span>
            <span className="neo-tag bg-[var(--accent-mint)]">{item.count}</span>
          </div>
        )) : (
          <div className="px-4 py-6 text-sm font-medium text-gray-600">No data yet</div>
        )}
      </div>
    </section>
  );
}

export default async function AnalyticsPage() {
  const summary = await getAnalyticsSummary();
  const latest = summary.recentEvents[0]?.ts
    ? new Date(summary.recentEvents[0].ts).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'No events';

  return (
    <div className="min-h-screen">
      <Header />

      <main className="px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 neo-tag bg-white">
                <Database className="h-4 w-4" />
                JSONL storage: {summary.storageMode}
              </div>
              <h1 className="text-4xl font-black uppercase md:text-6xl">Analytics</h1>
            </div>
            <p className="max-w-xl text-sm font-medium text-gray-700">
              Lightweight pageview analytics for the gallery. It stores route, referrer domain,
              coarse device type, country code, and timestamp only.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
            <StatBlock label="Pageviews" value={summary.totalPageviews} accent="bg-[var(--accent-coral)]" />
            <StatBlock label="Unique Paths" value={summary.uniquePaths} accent="bg-[var(--accent-mint)]" />
            <StatBlock label="Latest Event" value={latest} accent="bg-[var(--accent-lavender)]" />
            <StatBlock label="Storage" value={summary.storageMode.toUpperCase()} accent="bg-[var(--accent-blue)]" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DimensionList title="Top Pages" items={summary.topPaths} />
            <DimensionList title="Referrers" items={summary.referrers} />
            <DimensionList title="Devices" items={summary.devices} />
            <DimensionList title="Countries" items={summary.countries} />
          </div>

          <section className="neo-card mt-8 overflow-hidden bg-white">
            <div className="border-b-3 border-black bg-[var(--accent-coral)] px-4 py-3">
              <h2 className="flex items-center gap-2 font-black uppercase">
                <Activity className="h-5 w-5" />
                Recent Events
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="border-b-3 border-black bg-gray-100 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 font-black"><BarChart3 className="h-4 w-4" /></th>
                    <th className="px-4 py-3 font-black">Path</th>
                    <th className="px-4 py-3 font-black">Referrer</th>
                    <th className="px-4 py-3 font-black"><MonitorSmartphone className="h-4 w-4" /></th>
                    <th className="px-4 py-3 font-black"><Globe2 className="h-4 w-4" /></th>
                    <th className="px-4 py-3 font-black">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y-3 divide-black">
                  {summary.recentEvents.length > 0 ? summary.recentEvents.map((event) => (
                    <tr key={`${event.ts}-${event.path}`}>
                      <td className="px-4 py-3 text-sm font-bold">{event.type}</td>
                      <td className="px-4 py-3 text-sm font-bold">{event.path}</td>
                      <td className="px-4 py-3 text-sm">{event.referrer || '-'}</td>
                      <td className="px-4 py-3 text-sm">{event.device || '-'}</td>
                      <td className="px-4 py-3 text-sm">{event.country || '-'}</td>
                      <td className="px-4 py-3 text-sm">{new Date(event.ts).toLocaleString('en-US')}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-4 py-8 text-sm font-medium text-gray-600" colSpan={6}>
                        No analytics events have been recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
