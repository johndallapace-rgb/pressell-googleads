import React from 'react';

interface AdPreviewProps {
  headlines: string[];
  descriptions: string[];
  finalUrl: string;
  displayUrl?: string;
}

export default function AdPreviewCard({ headlines, descriptions, finalUrl, displayUrl }: AdPreviewProps) {
  // Simulate rotation or just take first few
  const h1 = headlines[0] || "Headline 1";
  const h2 = headlines[1] || "Headline 2";
  const d1 = descriptions[0] || "Description text goes here...";
  
  const display = displayUrl || finalUrl || "www.example.com";
  const cleanDisplay = display.replace(/^https?:\/\//, '').split('/')[0];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 max-w-xl font-sans">
      <div className="text-xs text-gray-500 mb-1">Ad · {cleanDisplay}</div>
      <div className="text-xl text-[#1a0dab] hover:underline cursor-pointer font-medium leading-snug truncate">
        {h1} | {h2}
      </div>
      <div className="text-sm text-[#4d5156] mt-1 leading-snug">
        {d1}
      </div>
      
      {/* Variation Pills */}
      <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Variations:</span>
        {headlines.slice(0, 5).map((h, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200" title={h}>
                H{i+1}
            </span>
        ))}
        {descriptions.slice(0, 2).map((d, i) => (
            <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100" title={d}>
                D{i+1}
            </span>
        ))}
      </div>
    </div>
  );
}
