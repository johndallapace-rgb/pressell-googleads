import { ProductConfig } from '@/lib/config';
import { CTAButton } from './CTAButton';
import { SafeImage } from './SafeImage';
import { TrustBar } from '@/components/public/TrustBar';

interface Props {
  product: ProductConfig;
}

export function ProductHero({ product }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
      <div className="md:flex">
        {/* Image Section */}
        <div className="md:w-1/2 bg-gray-100 min-h-[300px] md:min-h-[400px] flex items-center justify-center relative overflow-hidden">
          {product.image_url ? (
            <SafeImage 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-400 font-bold text-2xl tracking-widest uppercase">
              {product.name}
              <br/>
              <span className="text-sm font-normal normal-case block text-center mt-2">Product Image</span>
            </div>
          )}
          
          {/* Badge Overlay */}
          <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Review
          </div>
          
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">
             Updated: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
        </div>
        
        {/* Content */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
            {product.headline}
          </h1>
          {product.subheadline && (
            <p className="text-lg text-gray-600 mb-6">
              {product.subheadline}
            </p>
          )}
          
          <ul className="space-y-3 mb-8">
            {product.bullets.map((bullet, idx) => (
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
               href={product.official_url} // This will be overridden in page.tsx usually
               label={product.cta_text || 'Check Availability'} 
               fullWidth 
               trackingData={{ product: product.slug, variant: 'default' }}
             />
             
             <div className="mt-6">
                <TrustBar />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
