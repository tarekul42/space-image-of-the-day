import React from 'react';
import { ApodData } from '../../types/apod';

interface MediaSectionProps {
  apod: ApodData;
}

export const MediaSection: React.FC<MediaSectionProps> = ({ apod }) => {
  return (
    <div className="lg:col-span-8 relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-500/10 group">
      {apod.media_type === 'image' ? (
        <img
          src={apod.hdurl || apod.url}
          alt={apod.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
      ) : (
        <iframe
          src={`${apod.url}&autoplay=1&mute=1`}
          title={apod.title}
          className="w-full h-full border-none"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};
