import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Disclaimer | Top Product Official',
  description:
    'Disclaimer for Top Product Official, an internal advertising operations platform with documented Google Ads API integration and compliance-first workflows.',
};

export default function DisclaimerPage() {
  return (
    <MarketingShell>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900">Disclaimer</h1>
        <p className="mt-3 text-sm text-neutral-500">Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-10 space-y-8 text-neutral-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">1. Purpose</h2>
            <p>
              Top Product Official is an internal advertising operations platform used by our team to support campaign planning, reporting, and
              operational workflows. This page is provided for transparency and compliance review purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">2. Google Ads API</h2>
            <p>
              The platform may use the Google Ads API to retrieve performance metrics and support internal reporting and operational diagnostics.
              Access is limited to Google Ads accounts that are owned by us or explicitly authorized for operational management.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">3. No guarantees</h2>
            <p>
              The platform and its informational content are provided on an “as available” basis for internal operational support. We do not
              guarantee uninterrupted availability, accuracy of third-party data sources, or error-free operation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">4. No professional advice</h2>
            <p>
              Nothing on this website constitutes professional, legal, financial, or other advice. Any operational guidance or documentation is
              intended for internal process support and compliance context only.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">5. Policy-aware operations</h2>
            <p>
              Our workflows are designed to support policy-aware advertising operations. Users are responsible for ensuring that campaign assets and
              configurations comply with applicable platform requirements and policies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">6. Contact</h2>
            <p>
              For compliance or legal questions related to this platform, contact{' '}
              <a href="mailto:contact@topproductofficial.com" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">
                contact@topproductofficial.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </MarketingShell>
  );
}
