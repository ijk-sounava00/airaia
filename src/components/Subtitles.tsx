import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveTranscript, AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';

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

    // Fade subtitle out after 5 seconds of silence
    const timer = setTimeout(() => {
      setVisibleTranscript(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [transcript]);

  if (!visibleTranscript) return null;

  return (
    <div id="aira-live-caption-container" className="fixed bottom-28 inset-x-4 max-w-lg mx-auto z-20 pointer-events-none flex justify-center">
      <AnimatePresence>
        <motion.div
          key={visibleTranscript.timestamp}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.96 }}
          transition={{ duration: 0.25 }}
          className="px-4 py-2.5 rounded-full backdrop-blur-xl border bg-[#0a0d16]/85 shadow-xl flex items-center gap-2.5 text-center text-xs sm:text-sm text-slate-200"
          style={{ borderColor: currentTheme.border }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              backgroundColor:
                visibleTranscript.role === 'aira' ? currentTheme.surface : 'rgba(255, 255, 255, 0.08)',
              color: visibleTranscript.role === 'aira' ? currentTheme.accent : '#94a3b8',
              border: `1px solid ${visibleTranscript.role === 'aira' ? currentTheme.border : 'rgba(255, 255, 255, 0.1)'}`,
            }}
          >
            {visibleTranscript.role === 'aira' ? 'AIRA' : 'YOU'}
          </span>
          <p className="font-medium tracking-wide truncate max-w-xs sm:max-w-md">
            "{visibleTranscript.text}"
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
