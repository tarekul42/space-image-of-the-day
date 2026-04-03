import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export const StarField: React.FC = () => {
  const stars = useMemo(
    () =>
      Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 5,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#0a0a0c]">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
        />
      ))}
    </div>
  );
};
