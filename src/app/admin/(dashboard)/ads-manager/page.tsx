'use client';

import { useState } from 'react';

// Mock Data for MVP
const LOGS = [
  { id: 1, date: '2024-05-20 10:00', campaign: 'Mitolyn - Search', type: 'Conversion', details: 'Purchase (Value: $120)', cost: 1.50 },
  { id: 2, date: '2024-05-20 09:45', campaign: 'Mitolyn - Search', type: 'Click', details: 'Keyword: "mitolyn reviews"', cost: 1.20 },
  { id: 3, date: '2024-05-20 09:30', campaign: 'Woodworking - DIY', type: 'Click', details: 'Keyword: "wood projects"', cost: 0.80 },
];

export default function AdsManagerPage() {
  const [logs, setLogs] = useState(LOGS);

  const handleExportGemini = () => {
      const summary = logs.map(l => 
          `[${l.date}] ${l.campaign} | ${l.type}: ${l.details} | Cost: $${l.cost}`
      ).join('\n');
      
      const prompt = `Analyze these Google Ads logs and suggest optimizations for higher ROI:\n\n${summary}`;
      
      navigator.clipboard.writeText(prompt);
      alert('📋 Log copied to clipboard! Paste into Gemini chat.');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Ads Performance Manager</h1>
        <button 
            onClick={handleExportGemini}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
        >
            ✨ Export Log for Gemini Analysis
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow-sm border-l-4 border-blue-500">
              <p className="text-xs text-gray-500 uppercase">Total Spend</p>
              <p className="text-2xl font-bold">$345.20</p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm border-l-4 border-green-500">
              <p className="text-xs text-gray-500 uppercase">Conversions</p>
              <p className="text-2xl font-bold">12</p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm border-l-4 border-yellow-500">
              <p className="text-xs text-gray-500 uppercase">Clicks</p>
              <p className="text-2xl font-bold">450</p>
          </div>
          <div className="bg-white p-4 rounded shadow-sm border-l-4 border-purple-500">
              <p className="text-xs text-gray-500 uppercase">Avg CPC</p>
              <p className="text-2xl font-bold">$0.76</p>
          </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
              <h3 className="font-bold text-gray-700">Real-time Activity Log</h3>
          </div>
          <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Campaign</th>
                      <th className="px-6 py-3">Event</th>
                      <th className="px-6 py-3">Details</th>
                      <th className="px-6 py-3">Cost</th>
                  </tr>
              </thead>
              <tbody>
                  {logs.map(log => (
                      <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4">{log.date}</td>
                          <td className="px-6 py-4 font-medium text-gray-900">{log.campaign}</td>
                          <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  log.type === 'Conversion' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                  {log.type}
                              </span>
                          </td>
                          <td className="px-6 py-4">{log.details}</td>
                          <td className="px-6 py-4">${log.cost.toFixed(2)}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
    </div>
  );
}
