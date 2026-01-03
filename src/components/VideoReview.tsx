'use client';

import { useState } from 'react';

export interface VideoReviewType {
  provider: 'youtube';
  id: string;
  thumbnailUrl?: string;
  title?: string;
}

interface Props {
  video: VideoReviewType;
  disclaimer: string;
}

export function VideoReview({ video, disclaimer }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (video.provider !== 'youtube') return null; // Only YouTube supported for now

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div 
        className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 cursor-pointer group"
        onClick={() => setIsPlaying(true)}
      >
        {!isPlaying ? (
          <>
            {/* Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={video.thumbnailUrl || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`} 
              alt={video.title || 'Video Review'}
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            
            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <p className="text-white font-bold text-lg">{video.title || 'Watch Review'}</p>
            </div>
          </>
        ) : (
          <iframe
            className="w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title || 'Video Review'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">{disclaimer}</p>
    </div>
  );
}
