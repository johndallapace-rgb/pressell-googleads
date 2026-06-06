import Link from 'next/link';
import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Google Ads API Use Case | Top Product Official',
  description:
    'How Top Product Official uses the Google Ads API internally for campaign reporting, keyword analysis, and advertising workflow optimization.',
};

export default function GoogleAdsApiUseCasePage() {
  return (
    <MarketingShell active="google-ads-api-use-case">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Google Ads API Integration</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">
          Internal Google Ads API use case
        </h1>
        <p className="mt-6 text-lg text-neutral-600 leading-relaxed">
          Top Product Official is an internal advertising intelligence and campaign operations platform. We use the Google
          Ads API to support internal workflows for analysis, reporting, and structured campaign planning.
        </p>

        <div className="mt-12 grid gap-6">
          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Overview</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              Our platform is used internally by our team to support campaign analysis, keyword research, reporting
              workflows, and campaign structure planning.
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Business model</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              Top Product Official is not a public self-serve ad buying platform. It is an internal software environment
              used by our team to organize, analyze, and improve advertising operations.
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Google Ads API use cases</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              We use the Google Ads API to support internal advertising workflows, including:
            </p>
            <ul className="mt-4 space-y-2 text-neutral-700">
              <li className="flex gap-2">
                <span className="text-neutral-400">•</span>
                <span>Retrieving campaign performance metrics</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-400">•</span>
                <span>Analyzing keyword-level performance</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-400">•</span>
                <span>Generating internal reporting dashboards</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-400">•</span>
                <span>Reviewing campaign structure and setup quality</span>
              </li>
              <li className="flex gap-2">
                <span className="text-neutral-400">•</span>
                <span>Assisting campaign optimization workflows</span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Authorized access only</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              Our platform only accesses Google Ads accounts that are owned by us or explicitly authorized for
              operational management.
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Data handling</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              The platform processes advertising data for internal reporting, decision support, and workflow efficiency.
              We do not present this platform as a public service for managing third-party client accounts.
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Compliance</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              We aim to comply with applicable Google Ads API policies and platform requirements. Our workflows are
              designed to support internal advertising operations with transparency, structured account management, and
              policy-aware processes.
            </p>
            <p className="mt-4 text-sm text-neutral-500">
              See: <Link href="/compliance" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">Compliance</Link>
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-neutral-50 p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Contact</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              For compliance or integration questions, contact{' '}
              <a href="mailto:contact@topproductofficial.com" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">
                contact@topproductofficial.com
              </a>
              .
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/platform"
                className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                Platform Overview
              </Link>
              <Link
                href="/privacy-policy"
                className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </section>
        </div>
      </main>
    </MarketingShell>
  );
}

