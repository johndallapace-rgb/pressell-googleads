import { CTAButton } from '../CTAButton';

interface QuickVerdictProps {
  productName: string;
  verdict: 'recommended' | 'warning' | 'neutral';
  bestFor: string;
  notIdealFor?: string;
  bottomLine: string;
  ctaUrl: string;
  ctaText?: string;
  slug: string;
  googleAdsId?: string;
  googleAdsLabel?: string;
}

export function QuickVerdict({ 
  productName, 
  verdict = 'recommended', 
  bestFor, 
  notIdealFor, 
  bottomLine,
  ctaUrl,
  ctaText = 'Check Availability',
  slug,
  googleAdsId,
  googleAdsLabel
}: QuickVerdictProps) {
  
  const isRecommended = verdict === 'recommended';
  const bgClass = isRecommended ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200';
  const iconClass = isRecommended ? 'text-green-500' : 'text-yellow-500';

  return (
    <div className={`rounded-xl border ${bgClass} p-6 md:p-8 my-10 shadow-sm`}>
      <div className="flex items-center mb-6">
        <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mr-4 ${iconClass}`}>
           {isRecommended ? (
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           ) : (
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Quick Verdict</h3>
          <p className="text-sm text-gray-500">Our summary for busy readers</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <h4 className="font-bold text-gray-700 mb-2 flex items-center">
            <span className="text-green-500 mr-2">✓</span> Best For
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed">{bestFor}</p>
        </div>
        {notIdealFor && (
           <div>
            <h4 className="font-bold text-gray-700 mb-2 flex items-center">
              <span className="text-gray-400 mr-2">✕</span> Not Ideal If
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">{notIdealFor}</p>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-100 mb-6">
        <p className="text-gray-800 font-medium italic">
          "{bottomLine}"
        </p>
      </div>

      <div className="text-center md:text-left">
        <CTAButton 
          href={ctaUrl} 
          label={ctaText} 
          variant="secondary"
          className="text-base py-3 px-6 w-full md:w-auto"
          trackingData={{ product: slug, variant: 'quick_verdict' }}
          googleAdsId={googleAdsId}
          googleAdsLabel={googleAdsLabel}
        />
      </div>
    </div>
  );
}
