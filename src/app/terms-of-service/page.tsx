import Link from 'next/link';
import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Terms of Service | Top Product Official',
  description: 'Terms of Service for Top Product Official internal advertising intelligence and campaign operations platform.',
};

export default function TermsOfServicePage() {
  return (
    <MarketingShell>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900">Terms of Service</h1>
        <p className="mt-3 text-sm text-neutral-500">Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-10 space-y-8 text-neutral-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">1. Internal Platform</h2>
            <p>
              Top Product Official is an internal advertising intelligence and campaign operations platform used by our team. It is not a public self-serve advertising product and is not intended for general public use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">2. Authorized Access Only</h2>
            <p>
              Access is limited to our internal team and authorized personnel. The platform only accesses Google Ads accounts that are owned by us or explicitly authorized for operational management.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">3. Acceptable Use</h2>
            <p>
              Users must use the platform only for internal operational purposes, including campaign analysis, reporting, workflow planning, and controlled optimization. Unauthorized access, misuse, or distribution is prohibited.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">4. Google Ads API Use</h2>
            <p>
              The platform may use the Google Ads API to retrieve campaign performance metrics, analyze keyword performance, generate internal reporting dashboards, review campaign structure, and assist optimization workflows.
            </p>
            <p className="text-sm text-neutral-500">
              See also: <Link href="/google-ads-api-use-case" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">Google Ads API Use Case</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">5. Compliance</h2>
            <p>
              Our workflows are designed to support policy-aware advertising operations. Users are responsible for ensuring that campaign assets and configurations comply with applicable platform requirements and policies.
            </p>
            <p className="text-sm text-neutral-500">
              See also: <Link href="/compliance" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">Compliance</Link>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">6. Disclaimer</h2>
            <p>
              The platform is provided for internal operational support. We do not guarantee uninterrupted availability or error-free operation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">7. Contact</h2>
            <p>
              For questions regarding these terms, contact{' '}
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

