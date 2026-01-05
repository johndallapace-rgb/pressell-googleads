'use client';

export default function PlatformsPage() {
  const platforms = [
    { name: 'ClickBank', status: 'Active', products: 12 },
    { name: 'Digistore24', status: 'Connected', products: 5 },
    { name: 'MaxWeb', status: 'Pending', products: 0 },
    { name: 'BuyGoods', status: 'Disconnected', products: 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        🔗 Affiliate Platforms
      </h1>
      <p className="text-gray-600">
        Manage your integrations with major affiliate networks.
      </p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Platform</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Active Products</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {platforms.map((p) => (
              <tr key={p.name} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-bold text-gray-800">{p.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    p.status === 'Active' || p.status === 'Connected' 
                      ? 'bg-green-100 text-green-800' 
                      : p.status === 'Pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{p.products}</td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                    Configure
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
