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
              See:{' '}
              <Link href="/google-ads-api-use-case" prefetch={false} className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">
                Google Ads API Use Case
              </Link>
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Data usage</h2>
            <div className="mt-3 space-y-4 text-neutral-600 leading-relaxed">
              <p>
                The platform processes Google Ads account data for internal reporting, decision support, and workflow efficiency. The data we access is limited to what is required for these operational workflows.
              </p>
              <div className="rounded-xl border border-black/10 bg-neutral-50 p-5">
                <p className="text-sm font-semibold text-neutral-900">Typical data categories</p>
                <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                  <li className="flex gap-2"><span className="text-neutral-400">•</span><span>Campaign-level data (campaign configuration and performance metrics)</span></li>
                  <li className="flex gap-2"><span className="text-neutral-400">•</span><span>Ad group data (structure and performance metrics)</span></li>
                  <li className="flex gap-2"><span className="text-neutral-400">•</span><span>Keyword and search term performance signals used for relevance and efficiency review</span></li>
                  <li className="flex gap-2"><span className="text-neutral-400">•</span><span>Reporting metrics used for internal dashboards, alerts, and audits</span></li>
                </ul>
              </div>
              <p>
                We do not sell advertising data and we do not use Google Ads API data for personal user profiling. Access is restricted to owned or explicitly authorized accounts.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Data retention</h2>
            <div className="mt-3 space-y-4 text-neutral-600 leading-relaxed">
              <p>
                Data is retained at a high level for operational reporting, analytics, and auditability. Retention is aligned to internal operational needs and is limited to what is necessary to support reporting and troubleshooting.
              </p>
              <p className="text-sm text-neutral-600">
                We regularly review stored operational data and remove or rotate data that is no longer required for internal reporting and compliance purposes.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Access revocation</h2>
            <div className="mt-3 space-y-4 text-neutral-600 leading-relaxed">
              <p>
                Access to Google Ads accounts is granted through Google OAuth. Authorized users and account owners can revoke access at any time through their Google Account security settings.
              </p>
              <div className="rounded-xl border border-black/10 bg-neutral-50 p-5">
                <p className="text-sm font-semibold text-neutral-900">Disconnect process</p>
                <ul className="mt-3 space-y-2 text-sm text-neutral-700">
                  <li className="flex gap-2"><span className="text-neutral-400">•</span><span>Revoke the app’s access in the Google Account “Third‑party access” / security settings</span></li>
                  <li className="flex gap-2"><span className="text-neutral-400">•</span><span>Contact us for operational assistance if a disconnect must be confirmed or documented</span></li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Authorized accounts</h2>
            <p className="mt-3 text-neutral-600 leading-relaxed">
              The platform is built for internal operations and only accesses Google Ads accounts that are owned by us or explicitly authorized for operational management. We do not position the platform as a service for managing unrelated third-party client accounts.
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
                prefetch={false}
                className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
                prefetch={false}
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
