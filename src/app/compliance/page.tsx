import Link from 'next/link';
import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Compliance | Top Product Official',
  description: 'Compliance and transparency information for Top Product Official internal advertising operations platform.',
};

export default function CompliancePage() {
  return (
    <MarketingShell active="compliance">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Compliance & Policy</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">Compliance-first operations</h1>
        <p className="mt-6 text-lg text-neutral-600 leading-relaxed">
          Top Product Official is an internal advertising intelligence and campaign operations platform. It is designed to support structured, policy-aware advertising workflows.
        </p>

        <div className="mt-12 grid gap-6">
          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Internal use only</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              The platform is used exclusively for internal operational purposes by our team and is not offered as a public self-serve advertising platform.
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Authorized access and account scope</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              The platform only accesses Google Ads accounts that are owned by us or explicitly authorized for operational management. Access is restricted to internal users and authorized personnel.
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Google Ads API usage</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              We use the Google Ads API to retrieve campaign performance metrics, analyze keyword performance, generate internal reporting dashboards, review campaign structure, and assist campaign optimization workflows.
            </p>
            <p className="mt-4 text-sm text-neutral-500">
              See: <Link href="/google-ads-api-use-case" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">Google Ads API Use Case</Link>
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Data handling and confidentiality</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              Data processed by the platform is used for internal reporting, decision support, and workflow efficiency. We do not market the platform as a service for managing third-party client accounts.
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Operational guardrails</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              The platform is designed to support controlled execution with documented processes and guardrails that help reduce policy risk and protect profitability during optimization and scaling.
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-neutral-50 p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Contact</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              For compliance questions, contact{' '}
              <a href="mailto:contact@topproductofficial.com" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">
                contact@topproductofficial.com
              </a>
              .
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/privacy-policy"
                className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </section>
        </div>
      </main>
    </MarketingShell>
  );
}

