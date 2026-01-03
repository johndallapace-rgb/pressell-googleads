import { ProductConfig } from '@/lib/config';
import { CTAButton } from '@/components/CTAButton';
import { StickyCTA } from '@/components/StickyCTA';
import { SafeImage } from '@/components/SafeImage';

interface Props {
  product: ProductConfig;
}

export function ComparisonTemplate({ product }: Props) {
  const ctaUrl = product.affiliate_url; // Direct Affiliate Link (Bridged by CTAButton)

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800 bg-gray-50">
       <div className="bg-blue-900 text-white py-4 text-center font-bold uppercase tracking-widest text-sm">
         2024 Market Report
       </div>

       <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
         <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{product.headline}</h1>
            <p className="text-xl text-gray-600">{product.subheadline}</p>
         </div>

         <div className="grid md:grid-cols-3 gap-6 mb-12 items-start">
            {/* Competitor 1 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 opacity-75 hidden md:block">
                <div className="h-40 bg-gray-100 rounded mb-4 flex items-center justify-center text-gray-400 font-bold">Generic Brand A</div>
                <h3 className="font-bold text-lg mb-2 text-gray-400">Standard Option</h3>
                <ul className="text-sm space-y-2 text-gray-500">
                    <li className="flex items-center"><span className="text-red-400 mr-2">✕</span> Low Potency</li>
                    <li className="flex items-center"><span className="text-red-400 mr-2">✕</span> Synthetic Fillers</li>
                    <li className="flex items-center"><span className="text-red-400 mr-2">✕</span> No Guarantee</li>
                </ul>
            </div>

            {/* Winner (Our Product) */}
            <div className="bg-white p-6 rounded-xl border-2 border-blue-500 shadow-xl relative transform md:-translate-y-4 z-10">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase">
                    Top Pick
                </div>
                <div className="h-48 bg-blue-50 rounded mb-6 flex items-center justify-center relative overflow-hidden">
                     {product.image_url ? (
                        <SafeImage src={product.image_url} alt={product.name} className="h-full object-contain" />
                     ) : (
                        <span className="text-blue-200 font-bold text-2xl">{product.name}</span>
                     )}
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">{product.name}</h2>
                <div className="space-y-4 mb-8">
                     {product.bullets.map((bullet, i) => (
                        <div key={i} className="flex items-center bg-blue-50 p-2 rounded">
                            <span className="text-blue-600 mr-3 font-bold text-xl">✓</span>
                            <span className="font-medium text-gray-900">{bullet}</span>
                        </div>
                     ))}
                </div>
                <CTAButton 
                    href={ctaUrl} 
                    label={product.cta_text || 'Check Availability'} 
                    fullWidth
                    className="py-4 text-lg font-bold shadow-lg"
                    trackingData={{ product: product.slug, variant: 'comparison_card' }}
                    googleAdsId={product.google_ads_id}
                    googleAdsLabel={product.google_ads_label}
                />
            </div>

             {/* Competitor 2 */}
             <div className="bg-white p-6 rounded-lg border border-gray-200 opacity-75 hidden md:block">
                <div className="h-40 bg-gray-100 rounded mb-4 flex items-center justify-center text-gray-400 font-bold">Generic Brand B</div>
                <h3 className="font-bold text-lg mb-2 text-gray-400">Cheap Alternative</h3>
                <ul className="text-sm space-y-2 text-gray-500">
                    <li className="flex items-center"><span className="text-red-400 mr-2">✕</span> Unknown Origin</li>
                    <li className="flex items-center"><span className="text-red-400 mr-2">✕</span> Weak Formula</li>
                    <li className="flex items-center"><span className="text-green-500 mr-2">✓</span> Cheap Price</li>
                </ul>
            </div>
         </div>

         {/* Detailed Breakdown */}
         <div className="bg-white rounded-lg shadow-sm p-8 max-w-3xl mx-auto">
             <h3 className="text-2xl font-bold mb-6 text-center">Why We Ranked {product.name} #1</h3>
             {product.whatIs && (
                <div className="mb-6 prose prose-blue text-gray-600">
                    {product.whatIs.content.map((p, i) => <p key={i}>{p}</p>)}
                </div>
             )}
             
             {/* Simple Rating Table */}
             <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                     <thead>
                         <tr className="border-b-2 border-gray-100">
                             <th className="py-3 font-bold text-gray-500">Feature</th>
                             <th className="py-3 font-bold text-blue-600">{product.name}</th>
                             <th className="py-3 font-bold text-gray-400">Others</th>
                         </tr>
                     </thead>
                     <tbody>
                         <tr className="border-b border-gray-50">
                             <td className="py-3 font-medium">Ingredients</td>
                             <td className="py-3 text-green-600 font-bold">100% Natural</td>
                             <td className="py-3 text-gray-500">Artificial/Mixed</td>
                         </tr>
                         <tr className="border-b border-gray-50">
                             <td className="py-3 font-medium">Guarantee</td>
                             <td className="py-3 text-green-600 font-bold">60 Days</td>
                             <td className="py-3 text-gray-500">None/Limited</td>
                         </tr>
                         <tr className="border-b border-gray-50">
                             <td className="py-3 font-medium">Shipping</td>
                             <td className="py-3 text-green-600 font-bold">Fast & Insured</td>
                             <td className="py-3 text-gray-500">Slow</td>
                         </tr>
                     </tbody>
                 </table>
             </div>
         </div>

       </main>

       <StickyCTA 
          href={ctaUrl} 
          label={product.cta_text || 'Check Availability'} 
          trackingData={{ product: product.slug, variant: 'sticky' }}
          googleAdsId={product.google_ads_id}
          googleAdsLabel={product.google_ads_label}
        />

       <footer className="bg-gray-900 text-gray-500 py-8 text-center text-xs mt-12">
            <p className="mb-2">© {new Date().getFullYear()} Comparison Report. All rights reserved.</p>
            <div className="flex justify-center space-x-4">
                <a href="/legal/privacy" className="hover:text-white">Privacy</a>
                <a href="/legal/terms" className="hover:text-white">Terms</a>
            </div>
       </footer>
    </div>
  );
}
