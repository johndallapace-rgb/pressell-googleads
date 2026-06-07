import Link from 'next/link';
import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { FeatureGrid } from '@/components/marketing/FeatureGrid';

export const metadata: Metadata = {
  title: 'Platform | Top Product Official',
  description: 'Overview of Top Product Official internal advertising intelligence and campaign operations platform.',
};

export default function PlatformPage() {
  const features = [
    {
      title: 'Campaign Operations',
      description: 'Supports campaign structure planning, naming conventions, and internal launch workflows for Google Search campaigns.',
    },
    {
      title: 'Performance Analytics',
      description: 'Internal reporting views for account health, campaign trends, and operational diagnostics.',
    },
    {
      title: 'Keyword & Intent Intelligence',
      description: 'Helps interpret keyword intent and search term quality to reduce waste and improve relevance.',
    },
    {
      title: 'Workflow Automation',
      description: 'Assists repeatable tasks such as reporting, review cycles, and structured optimization guidance.',
    },
    {
      title: 'Policy-Aware Processes',
      description: 'Designed to support compliance-first execution with internal controls and documentation.',
    },
    {
      title: 'Export & Audit Support',
      description: 'Produces structured internal artifacts used for audits, reviews, and controlled decision workflows.',
    },
  ];

  return (
    <MarketingShell active="platform">
      <main>
        <section className="py-20 bg-gradient-to-b from-neutral-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Platform</p>
              <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
                Internal advertising intelligence and campaign operations
              </h1>
              <p className="mt-5 text-lg text-neutral-600 leading-relaxed">
                Top Product Official is used internally to support campaign analysis, keyword research, reporting workflows, and campaign structure planning for Google Search advertising.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/google-ads-api-use-case"
                  prefetch={false}
                  className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
                >
                  Google Ads API Use Case
                </Link>
                <Link
                  href="/compliance"
                  prefetch={false}
                  className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
                >
                  Compliance
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FeatureGrid
          title="What the platform supports"
          subtitle="A structured internal environment for campaign operations, reporting, and controlled optimization workflows."
          features={features}
        />

        <section className="py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2">
              <div className="rounded-2xl border border-black/10 bg-white p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Internal Use</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">Not a public self-serve product</h2>
                <p className="mt-4 text-neutral-600 leading-relaxed">
                  The platform is used exclusively for internal operational purposes and is not offered as a public self-serve advertising platform.
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Access Controls</p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">Authorized account access</h2>
                <p className="mt-4 text-neutral-600 leading-relaxed">
                  The platform only accesses Google Ads accounts that are owned by us or explicitly authorized for operational management.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
