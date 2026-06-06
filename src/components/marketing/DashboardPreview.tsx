import { MockChart } from './MockChart';

type DashboardCardProps = {
  title: string;
  subtitle: string;
  metricA: { label: string; value: string };
  metricB: { label: string; value: string };
  chartLabel: string;
};

function DashboardCard({ title, subtitle, metricA, metricB, chartLabel }: DashboardCardProps) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-neutral-900">{title}</p>
          <p className="mt-1 text-sm text-neutral-600">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-sky-500" />
          <p className="text-xs text-neutral-500">Mock Preview</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-black/10 bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">{metricA.label}</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">{metricA.value}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-neutral-50 p-4">
          <p className="text-xs text-neutral-500">{metricB.label}</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">{metricB.value}</p>
        </div>
      </div>

      <div className="mt-4">
        <MockChart label={chartLabel} />
      </div>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <section className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Dashboard Preview</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
            Internal reporting dashboards for advertising operations
          </h2>
          <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
            These previews illustrate the type of internal analytics views used by our team for campaign monitoring, keyword intelligence, and operational reporting.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <DashboardCard
            title="Campaign Performance Dashboard"
            subtitle="Daily performance monitoring and budget pacing."
            metricA={{ label: 'ROAS (est.)', value: '3.6×' }}
            metricB={{ label: 'CPA (est.)', value: '$28.40' }}
            chartLabel="Spend vs. Conversions"
          />
          <DashboardCard
            title="Keyword Intelligence Dashboard"
            subtitle="Query intent clustering and keyword efficiency review."
            metricA={{ label: 'Top Intent', value: 'Review' }}
            metricB={{ label: 'Waste Flagged', value: '$412' }}
            chartLabel="Intent Mix"
          />
          <DashboardCard
            title="Advertising Analytics Dashboard"
            subtitle="Account-level trends, alerts, and diagnostics."
            metricA={{ label: 'Optimization Score', value: '82' }}
            metricB={{ label: 'Alerts', value: '3' }}
            chartLabel="Trend Summary"
          />
        </div>
      </div>
    </section>
  );
}
