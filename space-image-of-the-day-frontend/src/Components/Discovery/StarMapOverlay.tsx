import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const StarMapOverlay: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const constellations = useMemo(() => {
    // Generate some random abstract constellations for the astronomer vibe
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x1: Math.random() * 100,
      y1: Math.random() * 100,
      x2: Math.random() * 100,
      y2: Math.random() * 100,
      label: [
        'Orion',
        'Cygnus',
        'Lyra',
        'Ursa Major',
        'Cassiopeia',
        'Andromeda',
        'Pegasus',
        'Draco',
      ][Math.floor(Math.random() * 8)],
    }));
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-40 pointer-events-auto bg-[#0a192f]/20 backdrop-blur-[1px] cursor-pointer"
          onClick={onClose}
        >
          {/* Blueprint / Reticle Grid */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(100,200,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(100,200,255,0.3)_1px,transparent_1px)] bg-[size:100px_100px]" />

          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {constellations.map((line) => (
              <g key={line.id}>
                <motion.line
                  x1={`${line.x1}%`}
                  y1={`${line.y1}%`}
                  x2={`${line.x2}%`}
                  y2={`${line.y2}%`}
                  stroke="rgba(100,200,255,0.4)"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5 + Math.random() * 2, ease: 'easeOut' }}
                />
                <circle
                  cx={`${line.x1}%`}
                  cy={`${line.y1}%`}
                  r="2"
                  fill="white"
                  className="drop-shadow-[0_0_8px_white]"
                />
                <circle
                  cx={`${line.x2}%`}
                  cy={`${line.y2}%`}
                  r="2"
                  fill="white"
                  className="drop-shadow-[0_0_8px_white]"
                />
                {line.id % 2 === 0 && (
                  <motion.text
                    x={`${(line.x1 + line.x2) / 2}%`}
                    y={`${(line.y1 + line.y2) / 2 - 2}%`}
                    fill="rgba(100,200,255,0.8)"
                    fontSize="11"
                    className="font-mono tracking-widest uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 + Math.random() }}
                  >
                    {line.label}
                  </motion.text>
                )}
              </g>
            ))}
          </svg>

          <div className="absolute top-8 left-8 border-l-2 border-blue-400 pl-3">
            <h3 className="text-blue-400 font-mono tracking-[0.3em] text-xs uppercase opacity-80">
              Telemetry
            </h3>
            <p className="text-white/60 font-mono text-[10px] mt-1">SIMULATION MODE: ACTIVE</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
