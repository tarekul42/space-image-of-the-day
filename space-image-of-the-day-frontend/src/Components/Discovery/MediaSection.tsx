import React from 'react';
import { ApodData } from '../../types/apod';
import { StarField } from './StarField';

interface MediaSectionProps {
  apod: ApodData;
}

const MIN_WIDTH = 1000;
const MIN_HEIGHT = 700;

export const MediaSection: React.FC<MediaSectionProps> = ({ apod }) => {
  // Treat image as low-res if we have dimensions and they fall below the threshold.
  // If dimensions are absent we assume high-res (e.g. today's APOD fetched without probing).
  const isLowRes =
    apod.width !== undefined &&
    apod.height !== undefined &&
    (apod.width < MIN_WIDTH || apod.height < MIN_HEIGHT);

  if (apod.media_type !== 'image') {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
        <iframe
          src={`${apod.url}&autoplay=1&mute=1`}
          title={apod.title}
          className="w-full h-full border-none"
        />
      </div>
    );
  }

  if (isLowRes) {
    return (
      // StarField fills the whole screen as the ambient background
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0a0a0c]">
        <StarField />
        {/* Low-res image: naturally sized, centered, never stretched */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <img
            src={apod.hdurl || apod.url}
            alt={apod.title}
            className="max-w-full max-h-full object-contain rounded-sm shadow-2xl"
            style={{ width: apod.width, maxHeight: '100vh' }}
          />
        </div>
      </div>
    );
  }

  // Standard full-bleed high-res render
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      <img src={apod.hdurl || apod.url} alt={apod.title} className="w-full h-full object-cover" />
    </div>
  );
};
