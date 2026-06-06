import Link from 'next/link';
import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { DashboardPreview } from '@/components/marketing/DashboardPreview';
import { DocSection } from '@/components/marketing/DocSection';

export const metadata: Metadata = {
  title: 'Google Ads API Integration | Top Product Official',
  description:
    'Developer documentation describing Top Product Official internal Google Ads API integration for campaign reporting, keyword analysis, and advertising workflow optimization.',
};

const lastUpdated = 'March 2026';

export default function DevelopersGoogleAdsApiPage() {
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'business-model', label: 'Business Model' },
    { id: 'use-case', label: 'Google Ads API Use Case' },
    { id: 'authorized-access', label: 'Authorized Access Only' },
    { id: 'data-handling', label: 'Data Handling' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <MarketingShell>
      <div className="bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid gap-10 lg:grid-cols-[280px_1fr] lg:items-start">
            <aside className="lg:sticky lg:top-24">
              <div className="rounded-2xl border border-black/10 bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Developers</p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">Google Ads API Integration</h1>
                <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
                  Documentation describing internal Google Ads API usage for advertising operations.
                </p>
                <p className="mt-4 text-xs text-neutral-500">Last updated: {lastUpdated}</p>

                <div className="mt-6 border-t border-black/10 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">On this page</p>
                  <div className="mt-3 flex flex-col gap-2 text-sm">
                    {sections.map((s) => (
                      <a key={s.id} href={`#${s.id}`} className="text-neutral-700 hover:text-neutral-900 transition-colors">
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-black/10 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Links</p>
                  <div className="mt-3 flex flex-col gap-2 text-sm">
                    <Link href="/privacy-policy" className="text-neutral-700 hover:text-neutral-900 transition-colors">
                      Privacy Policy
                    </Link>
                    <Link href="/terms-of-service" className="text-neutral-700 hover:text-neutral-900 transition-colors">
                      Terms of Service
                    </Link>
                    <Link href="/contact" className="text-neutral-700 hover:text-neutral-900 transition-colors">
                      Contact
                    </Link>
                  </div>
                </div>
              </div>
            </aside>

            <main className="space-y-6">
              <DocSection id="overview" title="Overview">
                <p>
                  Top Product Official is an internal advertising intelligence and campaign operations platform.
                </p>
                <p>
                  Our platform is used internally by our team to support campaign analysis, keyword research, reporting workflows, and campaign structure planning.
                </p>
              </DocSection>

              <DocSection id="business-model" title="Business Model">
                <p>
                  Top Product Official is not a public self-serve ad buying platform. It is an internal software environment used by our team to organize, analyze, and improve advertising operations.
                </p>
                <p className="text-sm text-neutral-600">
                  The platform is presented for transparency and compliance review. Access is restricted to authorized users and operational contexts.
                </p>
              </DocSection>

              <DocSection id="use-case" title="Google Ads API Use Case">
                <p>We use the Google Ads API to support internal advertising workflows, including:</p>
                <ul className="mt-2 space-y-2">
                  <li className="flex gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>retrieving campaign performance metrics</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>analyzing keyword-level performance</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>generating internal reporting dashboards</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>reviewing campaign structure</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>assisting campaign optimization processes</span>
                  </li>
                </ul>
                <div className="mt-5 rounded-xl border border-black/10 bg-neutral-50 p-5">
                  <p className="text-sm font-semibold text-neutral-900">Internal dashboards</p>
                  <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
                    The platform uses retrieved metrics to generate internal reporting dashboards and operational views for our team.
                  </p>
                </div>
              </DocSection>

              <DocSection id="authorized-access" title="Authorized Access Only">
                <p>
                  Our platform only accesses Google Ads accounts that are owned by us or explicitly authorized for operational management.
                </p>
                <p className="text-sm text-neutral-600">
                  We do not position the platform as a tool for managing unrelated third-party client accounts.
                </p>
              </DocSection>

              <DocSection id="data-handling" title="Data Handling">
                <p>
                  The platform processes advertising data for internal reporting, decision support, and workflow efficiency.
                </p>
                <p>
                  Data is used to understand campaign performance trends, keyword efficiency, and operational diagnostics so that internal users can plan and execute improvements in a controlled manner.
                </p>
              </DocSection>

              <DocSection id="compliance" title="Compliance">
                <p>
                  We aim to comply with applicable Google Ads API policies and platform requirements.
                </p>
                <p>
                  Our workflows are designed to support internal advertising operations with transparency, structured account management, and policy-aware processes.
                </p>
                <p className="text-sm text-neutral-600">
                  See also: <Link href="/compliance" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">Compliance</Link>.
                </p>
              </DocSection>

              <DocSection id="contact" title="Contact">
                <p>
                  For compliance or integration questions, contact{' '}
                  <a href="mailto:contact@topproductofficial.com" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">
                    contact@topproductofficial.com
                  </a>
                  .
                </p>
                <p className="text-sm text-neutral-600">
                  Website: <a href="https://www.topproductofficial.com" className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">https://www.topproductofficial.com</a>
                </p>
              </DocSection>
            </main>
          </div>
        </div>
      </div>

      <DashboardPreview />
    </MarketingShell>
  );
}

