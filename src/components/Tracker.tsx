'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { captureTrackingParams } from '@/lib/tracking';

export default function Tracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    captureTrackingParams(searchParams);
  }, [searchParams]);

  return null;
}
