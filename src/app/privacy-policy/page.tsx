import Link from 'next/link';
import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Privacy Policy | Top Product Official',
  description:
    'Privacy Policy for Top Product Official, an internal advertising operations platform with documented Google Ads API integration and compliance-focused data handling.',
};

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <main data-build-marker="marketing-shell-privacy-ac41246" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Legal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900">Privacy Policy</h1>
        <p className="mt-3 text-sm text-neutral-500">Last Updated: 06/06/2026</p>

        <div className="mt-10 space-y-8 text-neutral-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">1. Overview</h2>
            <p>
              This website and platform describe and support internal advertising operations. We process advertising data for internal reporting, decision support, and workflow efficiency.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">2. Data Processed</h2>
            <p>
              The platform may process campaign performance metrics, keyword-level performance, search term reports, and operational configuration data retrieved through authorized integrations (including the Google Ads API).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">3. Google Ads API</h2>
            <p>
              We use the Google Ads API to support internal advertising workflows, including retrieving performance metrics, analyzing keyword performance, generating reporting views, reviewing campaign structure, and assisting optimization workflows.
            </p>
            <p>
              The platform only accesses Google Ads accounts that are owned by us or explicitly authorized for operational management.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">4. Data Sharing</h2>
            <p>
              Advertising data is used for internal operational purposes. We do not sell or publicly distribute Google Ads account data. Any sharing is limited to internal stakeholders and authorized operational processes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-neutral-900">5. Contact</h2>
            <p>
              For privacy or compliance questions, contact{' '}
              <a href="mailto:contact@topproductofficial.com" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">
                contact@topproductofficial.com
              </a>
              .
            </p>
            <p className="text-sm text-neutral-500">
              You can also review our{' '}
              <Link href="/terms-of-service" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">
                Terms of Service
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </MarketingShell>
  );
}
