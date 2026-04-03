import React from 'react';
import { ApodData } from '../../types/apod';

interface MediaSectionProps {
  apod: ApodData;
}

export const MediaSection: React.FC<MediaSectionProps> = ({ apod }) => {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      {apod.media_type === 'image' ? (
        <img
          src={apod.hdurl || apod.url}
          alt={apod.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <iframe
          src={`${apod.url}&autoplay=1&mute=1`}
          title={apod.title}
          className="w-full h-full border-none"
        />
      )}
    </div>
  );
};
