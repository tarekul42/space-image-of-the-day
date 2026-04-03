import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, animate = true }) => {
  const content = (
    <div
      className={cn(
        'relative overflow-hidden bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-2xl',
        className,
      )}
    >
      {/* Dynamic Shine Effect */}
      <div className="absolute -inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    >
      {content}
    </motion.div>
  );
};
