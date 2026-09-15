import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveTranscript, AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';
import { Volume2, User } from 'lucide-react';

interface SubtitlesProps {
  transcript: LiveTranscript | null;
  auraTheme: AuraTheme;
}

export const Subtitles: React.FC<SubtitlesProps> = ({
  transcript,
  auraTheme,
}) => {
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;
  const [visibleTranscript, setVisibleTranscript] = useState<LiveTranscript | null>(null);

  useEffect(() => {
    if (!transcript) return;
    setVisibleTranscript(transcript);

    // Auto-hide caption after 6 seconds of inactivity
    const timer = setTimeout(() => {
      setVisibleTranscript(null);
    }, 6000);

    return () => clearTimeout(timer);
  }, [transcript]);

  if (!visibleTranscript) return null;

  const isAira = visibleTranscript.role === 'aira';

  return (
    <div
      id="aira-live-caption-container"
      className="fixed bottom-24 inset-x-4 max-w-xl mx-auto z-30 pointer-events-none flex justify-center"
    >
      <AnimatePresence>
        <motion.div
          key={visibleTranscript.timestamp}
          initial={{ opacity: 0, y: 14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="px-4 py-2.5 rounded-2xl backdrop-blur-2xl border shadow-2xl flex items-center gap-3 text-center text-xs sm:text-sm text-slate-100 max-w-full"
          style={{
            backgroundColor: 'rgba(8, 12, 22, 0.92)',
            borderColor: isAira ? currentTheme.border : 'rgba(255, 255, 255, 0.15)',
            boxShadow: isAira ? `0 10px 30px ${currentTheme.glow}` : '0 10px 30px rgba(0,0,0,0.6)',
          }}
        >
          {/* Speaker Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider shrink-0"
            style={{
              backgroundColor: isAira ? currentTheme.surface : 'rgba(255, 255, 255, 0.08)',
              color: isAira ? currentTheme.accent : '#cbd5e1',
              border: `1px solid ${isAira ? currentTheme.border : 'rgba(255, 255, 255, 0.12)'}`,
            }}
          >
            {isAira ? <Volume2 className="w-3 h-3 animate-pulse" /> : <User className="w-3 h-3" />}
            <span>{isAira ? 'AIRA' : 'YOU'}</span>
          </div>

          {/* Transcript Text */}
          <p className="font-medium tracking-wide text-left text-slate-200 line-clamp-2">
            "{visibleTranscript.text}"
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
