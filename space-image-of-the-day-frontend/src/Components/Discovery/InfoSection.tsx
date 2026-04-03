import React from 'react';
import { Telescope, Download } from 'lucide-react';
import { ApodData } from '../../types/apod';
import { GlassCard } from '../UI/GlassCard';
import { CosmicButton } from '../UI/CosmicButton';

interface InfoSectionProps {
  apod: ApodData;
  onFetchRandom: () => void;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ apod, onFetchRandom }) => {
  return (
    <div className="lg:col-span-4 flex flex-col gap-6">
      <GlassCard className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-blue-400 text-sm font-bold tracking-widest uppercase">
          <Telescope size={16} />
          Cosmic Discovery
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
          {apod.title}
        </h1>
        <p className="text-white/60 text-sm leading-relaxed line-clamp-4">{apod.explanation}</p>

        <div className="flex flex-wrap gap-2 mt-2">
          {apod.object_type && (
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/80">
              {apod.object_type}
            </span>
          )}
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4">
        <CosmicButton onClick={onFetchRandom}>Next Voyage</CosmicButton>
        <CosmicButton variant="secondary" onClick={() => window.open(apod.hdurl || apod.url)}>
          <Download size={18} className="mr-2" />
          HD View
        </CosmicButton>
      </div>
    </div>
  );
};
