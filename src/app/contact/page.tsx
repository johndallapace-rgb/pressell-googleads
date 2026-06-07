import Link from 'next/link';
import { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Contact Us | Top Product Official',
  description:
    'Contact Top Product Official for platform operations support, Google Ads API compliance inquiries, and privacy-related requests.',
};

export default function ContactPage() {
  return (
    <MarketingShell active="contact">
      <main data-build-marker="marketing-shell-contact-ac41246" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Contact</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-900">Contact</h1>
        <div className="mt-8 space-y-8 text-neutral-600">
          <p className="text-lg leading-relaxed">
            Top Product Official is an internal advertising operations platform. We support authorized account owners and internal users through the channels below.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/10 bg-neutral-50 p-6">
              <p className="text-sm font-semibold text-neutral-900">General inquiries</p>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Questions about the platform, internal access, and general operations.
              </p>
              <a
                href="mailto:contact@topproductofficial.com?subject=General%20Inquiry"
                className="mt-3 inline-flex text-neutral-900 font-semibold hover:text-neutral-700 transition-colors"
              >
                contact@topproductofficial.com
              </a>
            </div>

            <div className="rounded-2xl border border-black/10 bg-neutral-50 p-6">
              <p className="text-sm font-semibold text-neutral-900">Google Ads API inquiries</p>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Questions about our Google Ads API integration, account authorization, and operational scope.
              </p>
              <a
                href="mailto:contact@topproductofficial.com?subject=Google%20Ads%20API%20Inquiry"
                className="mt-3 inline-flex text-neutral-900 font-semibold hover:text-neutral-700 transition-colors"
              >
                contact@topproductofficial.com
              </a>
            </div>

            <div className="rounded-2xl border border-black/10 bg-neutral-50 p-6">
              <p className="text-sm font-semibold text-neutral-900">Compliance inquiries</p>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Compliance review questions, policy documentation requests, and audit coordination.
              </p>
              <a
                href="mailto:contact@topproductofficial.com?subject=Compliance%20Inquiry"
                className="mt-3 inline-flex text-neutral-900 font-semibold hover:text-neutral-700 transition-colors"
              >
                contact@topproductofficial.com
              </a>
            </div>

            <div className="rounded-2xl border border-black/10 bg-neutral-50 p-6">
              <p className="text-sm font-semibold text-neutral-900">Privacy inquiries</p>
              <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
                Privacy policy questions and requests related to data handling and access.
              </p>
              <a
                href="mailto:contact@topproductofficial.com?subject=Privacy%20Inquiry"
                className="mt-3 inline-flex text-neutral-900 font-semibold hover:text-neutral-700 transition-colors"
              >
                contact@topproductofficial.com
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-neutral-50 p-6">
            <p className="text-sm font-semibold text-neutral-900">Operating Region</p>
            <p className="mt-2 text-neutral-700 font-semibold">Global</p>
          </div>

          <div className="rounded-2xl border border-black/10 bg-neutral-50 p-6">
            <p className="text-sm font-semibold text-neutral-900">Related pages</p>
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
