import React, { useState } from 'react';
import { Telescope, Download, Info, X, Map } from 'lucide-react';
import { ApodData } from '../../types/apod';
import { GlassCard } from '../UI/GlassCard';
import { CosmicButton } from '../UI/CosmicButton';
import { AnimatePresence, motion } from 'framer-motion';

interface InfoSectionProps {
  apod: ApodData;
  onFetchRandom: () => void;
}

export const InfoSection: React.FC<InfoSectionProps> = ({ apod, onFetchRandom }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <GlassCard className="pointer-events-auto max-w-sm w-full flex flex-col gap-4 p-5 backdrop-blur-md bg-black/40 border-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
            <Telescope size={12} />
            Cosmic Discovery
          </div>
          <h1 className="text-xl font-bold tracking-tight leading-tight line-clamp-2">
            {apod.title}
          </h1>
        </div>
        
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/80"
          aria-label="Toggle Details"
        >
          {showDetails ? <X size={18} /> : <Info size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 border-t border-white/5">
              <p className="text-white/70 text-xs leading-relaxed max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {apod.explanation}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {apod.object_type && (
                <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-bold uppercase tracking-wider text-blue-300">
                  {apod.object_type}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 mt-1">
        <CosmicButton onClick={onFetchRandom} className="flex-1 py-2 text-xs">
          <Map size={14} className="mr-1.5" />
          Next
        </CosmicButton>
        <CosmicButton variant="secondary" onClick={() => window.open(apod.hdurl || apod.url)} className="flex-1 py-2 text-xs">
          <Download size={14} className="mr-1.5" />
          HD View
        </CosmicButton>
      </div>
    </GlassCard>
  );
};
