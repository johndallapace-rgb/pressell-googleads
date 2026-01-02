import { getCampaignMetrics, getCampaignConfig } from '@/lib/config';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  // Security check: In real app, check session/cookie here or via middleware.
  // Assuming this page is behind the same protection as other admin pages.
  
  const metrics = await getCampaignMetrics();
  const config = await getCampaignConfig();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Campaign Analytics (A/B Tests)</h1>
      
      {Object.keys(metrics).length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-center text-gray-500">
          No metrics data available yet. Start driving traffic to your campaigns.
        </div>
      ) : (
        <div className="grid gap-8">
          {Object.keys(metrics).map(slug => {
             const productName = config.products[slug]?.name || slug;
             const variants = metrics[slug];
             
             return (
               <div key={slug} className="bg-white rounded-lg shadow overflow-hidden">
                 <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
                    <h2 className="font-bold text-lg text-gray-800">{productName} <span className="text-gray-400 font-normal">({slug})</span></h2>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Active A/B Test</span>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                         <th className="px-6 py-3">Variant</th>
                         <th className="px-6 py-3 text-right">Views</th>
                         <th className="px-6 py-3 text-right">Clicks</th>
                         <th className="px-6 py-3 text-right">CTR</th>
                         <th className="px-6 py-3 text-right">Score</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y">
                       {Object.keys(variants).map(variantId => {
                         const stats = variants[variantId];
                         const ctr = stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0;
                         return (
                           <tr key={variantId} className="hover:bg-gray-50">
                             <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                               <span className={`w-3 h-3 rounded-full mr-2 ${variantId === 'A' ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                               {variantId}
                             </td>
                             <td className="px-6 py-4 text-right">{stats.views}</td>
                             <td className="px-6 py-4 text-right">{stats.clicks}</td>
                             <td className="px-6 py-4 text-right font-bold text-blue-600">{ctr.toFixed(2)}%</td>
                             <td className="px-6 py-4 text-right text-gray-400">
                               {/* Placeholder for complex score */}
                               -
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
}
