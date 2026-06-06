import { redirect } from 'next/navigation';
import { getCampaignConfig } from '@/lib/campaignConfig';
import { headers } from 'next/headers';
import { getVerticalFromHost } from '@/lib/host';
import Link from 'next/link';
import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { FeatureGrid } from '@/components/marketing/FeatureGrid';
import { DashboardPreview } from '@/components/marketing/DashboardPreview';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.topproductofficial.com'),
  title: 'Advertising Automation Platform | Top Product Official',
  description: 'Top Product Official is an internal advertising management platform used to create, manage and optimize Google Search campaigns for affiliate product promotions.',
  openGraph: {
    title: 'Advertising Automation Platform | Top Product Official',
    description: 'Internal advertising management platform for Google Search campaigns.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Advertising Automation Platform | Top Product Official',
    description: 'Internal advertising management platform for Google Search campaigns.',
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default async function HomePage() {
  // 1. Detect Host Vertical
  const headerList = await headers();
  const host = headerList.get('host');
  const detectedVertical = getVerticalFromHost(host);

  // 2. If Subdomain Vertical detected, keep existing logic (redirect to product)
  // This preserves existing subdomains logic (e.g. health.topproductofficial.com)
  if (detectedVertical) {
      const config = await getCampaignConfig();
      const products = config.products || {};
      const verticalProduct = Object.values(products).find(p => p.status === 'active' && p.vertical === detectedVertical);
      
      if (verticalProduct) {
          redirect(`/${verticalProduct.slug}`);
      }
      // If no product found for this vertical, show specific error
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600 p-4">
             <div className="max-w-md text-center">
                <h1 className="text-2xl font-bold mb-2 text-gray-800">No {detectedVertical.toUpperCase()} Offers</h1>
                <p>We couldn't find any active offers in this category right now.</p>
             </div>
        </div>
      );
  }

  // 3. Default Logic (Root Domain) -> RENDER INSTITUTIONAL HOMEPAGE
  // Removed fallback redirect logic for root domain to ensure "No Active Campaign" never shows on www/root
  const platformFeatures = [
    {
      title: 'Advertising Intelligence Platform',
      description: 'Operational visibility into account performance, trends, and diagnostics for internal decision support.',
    },
    {
      title: 'Campaign Automation',
      description: 'Assists structured campaign creation, naming, and setup workflows using policy-aware templates and safeguards.',
    },
    {
      title: 'Keyword Intelligence',
      description: 'Helps analyze keyword performance, intent groupings, and search term quality to reduce waste and improve relevance.',
    },
    {
      title: 'Performance Reporting',
      description: 'Generates internal reporting views and exports to support monitoring, audits, and operational accountability.',
    },
    {
      title: 'Advertising Workflow Optimization',
      description: 'Streamlines review cycles, guardrails, and planning logic to keep execution consistent and controlled.',
    },
    {
      title: 'Policy-Aware Operations',
      description: 'Designed for compliance-first execution with internal controls and clear documentation of API usage.',
    },
  ];

  return (
    <MarketingShell active="home">
      <section className="py-20 md:py-28 bg-gradient-to-b from-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-neutral-900 text-white text-xs font-semibold tracking-wide">
              Internal Platform
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-900">
              Advertising intelligence and campaign automation for internal operations
            </h1>
            <p className="mt-6 text-lg md:text-xl text-neutral-600 leading-relaxed">
              Top Product Official is used internally by our team to support campaign analysis, keyword research, reporting workflows, and campaign structure planning for Google Search advertising.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/google-ads-api-use-case"
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors"
              >
                Google Ads API Use Case
              </Link>
              <Link
                href="/platform"
                className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                Platform Overview
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="text-xs text-neutral-500">Google Ads API</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">Internal account operations</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="text-xs text-neutral-500">Reporting</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">Dashboards and exports</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="text-xs text-neutral-500">Compliance</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">Policy-aware workflows</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FeatureGrid
        title="Core capabilities"
        subtitle="A structured internal platform that supports advertising operations end-to-end with clear, policy-aware workflows."
        features={platformFeatures}
      />

      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">How It Works</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">Operational workflow</h2>
            <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
              The platform supports internal execution by combining reporting, analysis, and planning into a consistent process.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-black/10 bg-white p-6">
              <p className="text-sm font-semibold text-neutral-900">1. Retrieve</p>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Pull campaign, ad group, keyword, and search term performance data for internal reporting and review.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-6">
              <p className="text-sm font-semibold text-neutral-900">2. Analyze</p>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Identify intent patterns, efficiency signals, and policy risks to guide safe optimization decisions.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-6">
              <p className="text-sm font-semibold text-neutral-900">3. Plan</p>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Assist campaign structure planning, keyword grouping, and ad copy support workflows for internal use.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-6">
              <p className="text-sm font-semibold text-neutral-900">4. Optimize</p>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Support controlled execution with guardrails and workflow automation to reduce waste and stabilize scaling.
              </p>
            </div>
          </div>
        </div>
      </section>

      <DashboardPreview />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Technology Stack</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900">
                Built for internal reliability and auditability
              </h2>
              <p className="mt-4 text-lg text-neutral-600 leading-relaxed">
                The platform is implemented as a Next.js App Router application with structured backend automation and clear operational boundaries.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-black/10 bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-900">Next.js (App Router)</p>
                  <p className="mt-1 text-sm text-neutral-600">Server-side rendering, route-based rendering, internal APIs.</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-900">TypeScript</p>
                  <p className="mt-1 text-sm text-neutral-600">Typed contracts for internal workflows and data exports.</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-900">TailwindCSS</p>
                  <p className="mt-1 text-sm text-neutral-600">Consistent UI styling for documentation and compliance pages.</p>
                </div>
                <div className="rounded-xl border border-black/10 bg-neutral-50 p-4">
                  <p className="text-sm font-semibold text-neutral-900">Google Ads API</p>
                  <p className="mt-1 text-sm text-neutral-600">Internal reporting, analysis, and workflow support.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-neutral-950 p-8 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Compliance & Policy</p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight">Designed for internal use and controlled access</h3>
              <p className="mt-4 text-white/70 leading-relaxed">
                The platform is not a public self-serve ad buying product. It is used internally by our team to organize and improve advertising operations for accounts that we own or are explicitly authorized to manage.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/compliance"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 transition-colors"
                >
                  Compliance Overview
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Contact
                </Link>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-3 text-sm text-white/80">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold">Authorized access only</p>
                  <p className="mt-1 text-white/70">Internal team operations for owned or explicitly authorized accounts.</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold">Policy-aware workflows</p>
                  <p className="mt-1 text-white/70">Operational controls to reduce policy risk and protect profitability.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
