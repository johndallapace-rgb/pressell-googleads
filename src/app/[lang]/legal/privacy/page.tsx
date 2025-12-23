import { getDictionary } from '@/i18n/getDictionary';
import { PageProps } from '@/types';
import { Locale } from '@/i18n/i18n-config';

export async function generateMetadata({ params }: PageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return { title: dict.menu.privacy };
}

export default async function PrivacyPage({ params }: PageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="container mx-auto px-4 py-12 prose text-gray-700 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">{dict.menu.privacy}</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <p className="mb-4">
        Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you visit our website.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900">Cookies and Tracking Technologies</h2>
      <p className="mb-4">
        We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier.
      </p>
      <p className="mb-4">
        We may use third-party services such as Google Analytics and Google Ads to collect, monitor and analyze this type of information in order to increase our Service&apos;s functionality. These third-party service providers have their own privacy policies addressing how they use such information.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900">Google Ads</h2>
      <p className="mb-4">
        We may use Google Ads remarketing service to advertise on third party websites (including Google) to previous visitors to our site. It could mean that we advertise to previous visitors who haven&apos;t completed a task on our site, for example using the contact form to make an enquiry. This could be in the form of an advertisement on the Google search results page, or a site in the Google Display Network. Third-party vendors, including Google, use cookies to serve ads based on someone&apos;s past visits. Of course, any data collected will be used in accordance with our own privacy policy and Google&apos;s privacy policy.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900">Opt-Out</h2>
      <p className="mb-4">
        You can set preferences for how Google advertises to you using the Google Ad Preferences page, and if you want to you can opt out of interest-based advertising entirely by cookie settings or permanently using a browser plugin.
      </p>
    </div>
  );
}
