import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApodData } from '../../types/apod';
import { StarField } from './StarField';
import { getImageBlob } from '../../utils/storage';

interface MediaSectionProps {
  apod: ApodData;
}

const MIN_WIDTH = 1000;
const MIN_HEIGHT = 700;

export const MediaSection: React.FC<MediaSectionProps> = ({ apod }) => {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isCancelled = false;

    const loadMedia = async () => {
      setIsReady(false);
      
      if (apod.media_type !== 'image') {
        setImgUrl(apod.url);
        setIsReady(true);
        return;
      }

      try {
        // 1. Try to get blob from IndexedDB
        const blob = await getImageBlob(apod.date);
        
        // Safety: ensure blob is not empty (ORB check)
        const isValidBlob = blob && blob.size > 1024;
        const sourceUrl = isValidBlob ? URL.createObjectURL(blob) : (apod.hdurl || apod.url);
        if (isValidBlob) objectUrl = sourceUrl;

        // 2. Pre-decode the image
        const img = new Image();
        img.src = sourceUrl;
        
        try {
          await img.decode();
          if (!isCancelled) {
            setImgUrl(sourceUrl);
            setIsReady(true);
          }
        } catch (decodeErr) {
          console.warn('Decoding failed, falling back to remote URL:', decodeErr);
          // If decoding failed and we were using a blob, try remote URL instead
          if (isValidBlob && !isCancelled) {
            setImgUrl(apod.hdurl || apod.url);
            setIsReady(true);
          } else if (!isCancelled) {
            // If already remote, just show it anyway (browser might handle it better)
            setImgUrl(sourceUrl);
            setIsReady(true);
          }
        }
      } catch (err) {
        console.error('Failed to load media:', err);
        if (!isCancelled) {
          setImgUrl(apod.hdurl || apod.url);
          setIsReady(true);
        }
      }
    };

    loadMedia();

    return () => {
      isCancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [apod]);

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

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      <StarField />
      <AnimatePresence>
        {isReady && imgUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full"
          >
            {isLowRes ? (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <img
                  src={imgUrl}
                  alt={apod.title}
                  className="max-w-full max-h-full object-contain rounded-sm shadow-2xl"
                  style={{ width: apod.width, maxHeight: '100vh' }}
                />
              </div>
            ) : (
              <img
                src={imgUrl}
                alt={apod.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
