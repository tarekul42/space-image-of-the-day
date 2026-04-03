import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApod } from '../../context/ApodContext';
import { GlassCard } from '../UI/GlassCard';
import { CosmicButton } from '../UI/CosmicButton';
import { Telescope, Download } from 'lucide-react';

export const ApodDisplay: React.FC = () => {
  const { apod, loading, fetchApod } = useApod();

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
            <p className="mt-4 text-blue-400/80 text-[10px] font-bold tracking-[0.3em] uppercase animate-pulse">
              Analyzing Sector
            </p>
          </motion.div>
        ) : (
          apod && (
            <motion.div
              key={apod.date}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Media Section */}
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

              {/* Info Section */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <GlassCard className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-bold tracking-widest uppercase">
                    <Telescope size={16} />
                    Cosmic Discovery
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                    {apod.title}
                  </h1>
                  <p className="text-white/60 text-sm leading-relaxed line-clamp-4">
                    {apod.explanation}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {apod.object_type && (
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-white/80">
                        {apod.object_type}
                      </span>
                    )}
                  </div>
                </GlassCard>

                <div className="grid grid-cols-2 gap-4">
                  <CosmicButton onClick={() => fetchApod('FETCH_RANDOM')}>Next Voyage</CosmicButton>
                  <CosmicButton
                    variant="secondary"
                    onClick={() => window.open(apod.hdurl || apod.url)}
                  >
                    <Download size={18} className="mr-2" />
                    HD View
                  </CosmicButton>
                </div>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};
