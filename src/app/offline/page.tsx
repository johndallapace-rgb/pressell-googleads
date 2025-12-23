import LayoutShell from '@/components/LayoutShell';

export default function OfflinePage() {
  return (
    <LayoutShell>
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">You are offline</h1>
        <p className="text-gray-600 text-lg">
          Please check your internet connection and try again.
        </p>
      </div>
    </LayoutShell>
  );
}
