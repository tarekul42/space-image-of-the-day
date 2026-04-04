import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApod } from '../../context/ApodContext';
import { LoadingView } from './LoadingView';
import { ErrorView } from './ErrorView';
import { MediaSection } from './MediaSection';
import { InfoSection } from './InfoSection';
import { SettingsMenu } from '../UI/SettingsMenu';
import { StarMapOverlay } from './StarMapOverlay';

export const ApodDisplay: React.FC = () => {
  const { apod, loading, error, fetchApod } = useApod();
  const [isMapOpen, setIsMapOpen] = React.useState(false);

  return (
    <div className="absolute inset-0 w-full h-full">
      <AnimatePresence mode="wait">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <LoadingView />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <ErrorView error={error} onRetry={() => fetchApod()} />
          </div>
        ) : (
          apod && (
            <motion.div
              key={apod.date}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full"
            >
              <SettingsMenu />
              <StarMapOverlay isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />
              <MediaSection apod={apod} />
              <div className="absolute inset-0 z-50 pointer-events-none p-6 md:p-8 flex items-end justify-start">
                <InfoSection
                  apod={apod}
                  onFetchRandom={() => fetchApod('FETCH_RANDOM')}
                  onToggleMap={() => setIsMapOpen(true)}
                />
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};
