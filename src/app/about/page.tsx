import Link from 'next/link';
import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'About Us | Top Product Official',
  description:
    'Learn about Top Product Official, an internal advertising operations platform built for compliant Google Ads campaign management, reporting, and analytics.',
};

export default function AboutPage() {
  return (
    <MarketingShell active="about">
      <main data-build-marker="marketing-shell-about-ac41246" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">About</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900">Built for internal advertising operations</h1>
        <div className="mt-8 space-y-10 text-neutral-600 leading-relaxed">
          <section className="space-y-4">
            <p>
              Top Product Official is an internal advertising operations platform used by our team to plan, monitor, and improve Google Search campaigns. The platform brings together reporting, diagnostics, and structured execution workflows in a controlled environment.
            </p>
            <p>
              We do not offer this platform as a public self-serve advertising product and we do not provide campaign management services for unrelated third-party client accounts.
            </p>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">What the platform does</h2>
            <div className="mt-4 space-y-3">
              <p>
                The platform supports internal workflows such as performance reporting, keyword and intent analysis, campaign structure planning, and operational audits.
              </p>
              <p>
                It is designed to help internal users keep execution consistent through documented processes, repeatable templates, and compliance-aware guardrails.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Why we use the Google Ads API</h2>
            <div className="mt-4 space-y-3">
              <p>
                The Google Ads API enables our platform to retrieve account performance metrics and support internal reporting, analysis, and operational review workflows.
              </p>
              <p>
                When enabled for authorized accounts, the API can also support controlled campaign operations in a way that is auditable and aligned with policy-aware workflows.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-8">
            <h2 className="text-xl font-semibold text-neutral-900">Internal-only and authorized access</h2>
            <div className="mt-4 space-y-3">
              <p>
                Access is limited to internal users. The platform only accesses Google Ads accounts that are owned by us or explicitly authorized for operational management.
              </p>
              <p>
                Our compliance posture is built around clear account scoping, transparent data handling, and support for access revocation when required.
              </p>
            </div>
          </section>

          <div className="rounded-2xl border border-black/10 bg-neutral-50 p-6">
            <p className="text-sm font-semibold text-neutral-900">Learn more</p>
            <div className="mt-3 flex flex-col sm:flex-row gap-3 text-sm">
              <Link href="/google-ads-api-use-case" prefetch={false} className="rounded-xl border border-black/10 bg-white px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors">
                Google Ads API Use Case
              </Link>
              <Link href="/developers/google-ads-api" prefetch={false} className="rounded-xl border border-black/10 bg-white px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors">
                Developers / API Integration
              </Link>
              <Link href="/compliance" prefetch={false} className="rounded-xl border border-black/10 bg-white px-4 py-2 font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors">
                Compliance Overview
              </Link>
            </div>
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
