import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { GlassCard } from '../UI/GlassCard';
import { CosmicButton } from '../UI/CosmicButton';

interface ErrorViewProps {
  error: string;
  onRetry: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({ error, onRetry }) => (
  <motion.div
    key="error"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="max-w-md w-full"
  >
    <GlassCard className="flex flex-col items-center text-center gap-6 border-red-500/20">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
        <AlertCircle size={32} />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-red-400">Signal Lost</h2>
        <p className="text-white/60 text-sm leading-relaxed">
          The cosmic data stream is currently interrupted. This might be a connection issue or a
          synchronization error.
        </p>
        <div className="px-4 py-2 bg-black/40 rounded-lg border border-red-500/10 text-[10px] font-mono text-red-300/80 break-all">
          {error}
        </div>
      </div>
      <CosmicButton onClick={onRetry}>
        <RefreshCw size={18} className="mr-2" />
        Retry Connection
      </CosmicButton>
    </GlassCard>
  </motion.div>
);
