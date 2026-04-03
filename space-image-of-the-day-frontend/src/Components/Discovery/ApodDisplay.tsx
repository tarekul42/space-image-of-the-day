import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApod } from '../../context/ApodContext';
import { LoadingView } from './LoadingView';
import { ErrorView } from './ErrorView';
import { MediaSection } from './MediaSection';
import { InfoSection } from './InfoSection';

export const ApodDisplay: React.FC = () => {
  const { apod, loading, error, fetchApod } = useApod();

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-12">
      <AnimatePresence mode="wait">
        {loading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView error={error} onRetry={() => fetchApod()} />
        ) : (
          apod && (
            <motion.div
              key={apod.date}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <MediaSection apod={apod} />
              <InfoSection apod={apod} onFetchRandom={() => fetchApod('FETCH_RANDOM')} />
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};
