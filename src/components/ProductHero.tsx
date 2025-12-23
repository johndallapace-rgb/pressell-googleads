import { Product } from '@/data/products';
import CTAButton from './CTAButton';
import { Locale } from '@/i18n/i18n-config';

interface Props {
  product: Product;
  lang: Locale;
}

export default function ProductHero({ product, lang }: Props) {
  const t = product.translations[lang] || product.translations['en'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
      <div className="md:flex">
        {/* Image Placeholder */}
        <div className="md:w-1/2 bg-gray-100 min-h-[300px] md:min-h-[400px] flex items-center justify-center relative">
          <div className="text-gray-400 font-bold text-2xl tracking-widest uppercase">
            {t.name}
            <br/>
            <span className="text-sm font-normal normal-case block text-center mt-2">Product Image</span>
          </div>
          {/* Badge Overlay */}
          <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Top Choice
          </div>
        </div>
        
        {/* Content */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            {t.heroHeadline}
          </h1>
          {t.subHeadline && (
            <p className="text-lg text-gray-600 mb-6">
              {t.subHeadline}
            </p>
          )}
          
          <ul className="space-y-3 mb-8">
            {t.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto">
             <CTAButton 
               href={product.officialUrl} 
               label={t.ctaLabel} 
               fullWidth 
               trackingData={{ product: product.slug, variant: 'default', lang }}
             />
             <p className="text-xs text-center text-gray-400 mt-3">
               Official Site • 60-Day Money Back Guarantee
             </p>
          </div>
        </div>
      </div>
      
      {/* Trust Badges Bar */}
      <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
         <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
            {t.badges.map((b, i) => (
              <span key={i} className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                {b}
              </span>
            ))}
         </div>
      </div>
    </div>
  );
}
