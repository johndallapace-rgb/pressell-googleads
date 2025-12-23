export default function TrustBadges({ badges }: { badges: string[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
      {badges.map((badge, index) => (
        <div key={index} className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="w-12 h-12 mb-2 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-700">{badge}</span>
        </div>
      ))}
    </div>
  );
}
