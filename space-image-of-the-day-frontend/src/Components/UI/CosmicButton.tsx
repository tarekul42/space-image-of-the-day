import React from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';

interface CosmicButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const CosmicButton: React.FC<CosmicButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}) => {
  const variants = {
    primary: 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500',
    secondary:
      'bg-white/10 text-white/90 backdrop-blur-3xl hover:bg-white/20 border border-white/10',
    ghost: 'bg-transparent text-white/60 hover:text-white hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base font-semibold',
    lg: 'px-10 py-5 text-lg font-bold tracking-tight',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl transition-all duration-300',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};
