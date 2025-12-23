import { getDictionary } from '@/i18n/getDictionary';
import { PageProps } from '@/types';
import { Locale } from '@/i18n/i18n-config';

export async function generateMetadata({ params }: PageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return { title: dict.menu.terms };
}

export default async function TermsPage({ params }: PageProps) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);

  return (
    <div className="container mx-auto px-4 py-12 prose text-gray-700 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">{dict.menu.terms}</h1>
      <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900">1. Informational Purpose Only</h2>
      <p className="mb-4">
        The content provided on this website is for informational and educational purposes only. It is not intended to be a substitute for professional advice, diagnosis, or treatment.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900">2. No Warranties</h2>
      <p className="mb-4">
        This website is provided &quot;as is&quot; without any representations or warranties, express or implied. We make no representations or warranties in relation to this website or the information and materials provided on this website.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900">3. Limitation of Liability</h2>
      <p className="mb-4">
        We will not be liable to you (whether under the law of contact, the law of torts or otherwise) in relation to the contents of, or use of, or otherwise in connection with, this website for any direct, indirect, special or consequential loss.
      </p>
      
      <h2 className="text-xl font-bold mt-6 mb-4 text-gray-900">4. External Links</h2>
      <p className="mb-4">
        This website may contain links to external websites that are not provided or maintained by or in any way affiliated with us. Please note that we do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.
      </p>
    </div>
  );
}
