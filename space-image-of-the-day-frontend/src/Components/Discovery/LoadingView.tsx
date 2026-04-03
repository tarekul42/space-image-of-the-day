import React from 'react';
import { motion } from 'framer-motion';

export const LoadingView: React.FC = () => (
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
);
