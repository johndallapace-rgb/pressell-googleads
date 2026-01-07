'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  fill?: boolean;
}

export function SafeImage({ 
    src, 
    alt, 
    className, 
    fallbackSrc = '/images/placeholder.svg',
    width,
    height,
    priority = false,
    fill = false
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
      setImgSrc(src);
  }, [src]);

  // If fill is true, render with fill (requires parent relative + height)
  if (fill) {
      return (
        <div className={`relative ${className || ''}`}>
            <Image 
                src={imgSrc} 
                alt={alt} 
                fill
                priority={priority}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                onError={() => setImgSrc(fallbackSrc)}
            />
        </div>
      );
  }

  // Default: Responsive Image (mimics img w-full h-auto)
  // We provide a base aspect ratio (800x600) but allow CSS to override width/height
  return (
    <Image 
      src={imgSrc} 
      alt={alt} 
      width={width || 800}
      height={height || 600}
      priority={priority}
      className={className}
      style={{ width: '100%', height: 'auto' }}
      sizes="(max-width: 768px) 100vw, 800px"
      onError={() => setImgSrc(fallbackSrc)}
    />
  );
}
