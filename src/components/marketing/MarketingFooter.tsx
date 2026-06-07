import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="py-14 bg-neutral-950 text-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white font-semibold">
                T
              </div>
              <span className="font-semibold tracking-tight">Top Product Official</span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Internal advertising intelligence and campaign operations platform used by our team to plan, monitor, and optimize Google Search campaigns.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-neutral-400">Company</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/about" prefetch={false} className="text-neutral-200 hover:text-sky-200 transition-colors">
                About
              </Link>
              <Link href="/platform" prefetch={false} className="text-neutral-200 hover:text-sky-200 transition-colors">
                Platform
              </Link>
              <Link href="/google-ads-api-use-case" prefetch={false} className="text-neutral-200 hover:text-sky-200 transition-colors">
                Google Ads API Use Case
              </Link>
              <Link href="/developers/google-ads-api" prefetch={false} className="text-neutral-200 hover:text-sky-200 transition-colors">
                Developers / API Integration
              </Link>
              <Link href="/compliance" prefetch={false} className="text-neutral-200 hover:text-sky-200 transition-colors">
                Compliance
              </Link>
              <Link href="/contact" prefetch={false} className="text-neutral-200 hover:text-sky-200 transition-colors">
                Contact
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-neutral-400">Contact</p>
            <div className="space-y-2 text-sm text-neutral-200">
              <a href="mailto:contact@topproductofficial.com" className="hover:text-sky-200 transition-colors">
                contact@topproductofficial.com
              </a>
              <p className="text-neutral-400">Operating Region: Global</p>
              <div className="flex flex-wrap gap-4 pt-2 text-sm text-neutral-300">
                <Link href="/privacy-policy" prefetch={false} className="hover:text-sky-200 transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms-of-service" prefetch={false} className="hover:text-sky-200 transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <p className="text-xs text-neutral-500">© {new Date().getFullYear()} Top Product Official. All rights reserved.</p>
          <p className="text-xs text-neutral-500">
            Internal use only. Access is limited to accounts owned by us or explicitly authorized for operational management.
          </p>
          <p className="text-xs text-neutral-500">
            Internal advertising intelligence platform with documented API use case and compliance pages.
          </p>
        </div>
      </div>
    </footer>
  );
}
