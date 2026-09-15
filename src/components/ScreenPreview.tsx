import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Monitor,
  Square,
  Eye,
  Scan,
  Minimize2,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { AuraTheme } from '../types';
import { AURA_THEMES } from '../data/auraThemes';

interface ScreenPreviewProps {
  stream: MediaStream | null;
  isSharing: boolean;
  isAnalyzing: boolean;
  lastFrameAt: number | null;
  auraTheme: AuraTheme;
  sourceLabel?: string;
  onStop: () => void;
  onForceInspect?: () => void;
}

export const ScreenPreview: React.FC<ScreenPreviewProps> = ({
  stream,
  isSharing,
  isAnalyzing,
  lastFrameAt,
  auraTheme,
  sourceLabel,
  onStop,
  onForceInspect,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const currentTheme = AURA_THEMES[auraTheme] || AURA_THEMES.cyan;

  // Bind video stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn('Screen preview autoplay:', e));
    }
  }, [stream]);

  if (!isSharing || !stream) {
    return null;
  }

  return (
    <motion.div
      id="aira-screen-preview-float"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed bottom-24 right-4 z-40 max-w-[280px] sm:max-w-[320px] w-full select-none"
    >
      <div
        className="relative rounded-2xl backdrop-blur-2xl bg-[#090e1c]/90 border shadow-2xl overflow-hidden transition-all duration-300"
        style={{
          borderColor: isAnalyzing ? currentTheme.accent : currentTheme.border,
          boxShadow: isAnalyzing
            ? `0 0 25px ${currentTheme.glow}, 0 10px 30px rgba(0,0,0,0.8)`
            : `0 8px 32px rgba(0,0,0,0.6)`,
        }}
      >
        {/* Holographic Header Bar */}
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.03]"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Live Red/Theme Pulsing Status Dot */}
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: isAnalyzing ? currentTheme.accent : '#ef4444' }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: isAnalyzing ? currentTheme.accent : '#ef4444' }}
              />
            </span>

            <div className="flex items-center gap-1.5 min-w-0">
              <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-semibold tracking-wider text-slate-200 uppercase font-mono truncate">
                {isAnalyzing ? 'Analyzing Frame...' : 'Live Screen'}
              </span>
            </div>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Force Inspect Button */}
            {onForceInspect && !isMinimized && (
              <button
                type="button"
                onClick={onForceInspect}
                title="Send fresh screenshot to AIRA"
                aria-label="Force inspect screen"
                className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Minimize / Maximize */}
            <button
              type="button"
              onClick={() => setIsMinimized((prev) => !prev)}
              title={isMinimized ? 'Expand Preview' : 'Minimize Preview'}
              aria-label={isMinimized ? 'Expand screen preview' : 'Minimize screen preview'}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isMinimized ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Stop Sharing */}
            <button
              type="button"
              onClick={onStop}
              title="Stop screen sharing"
              aria-label="Stop screen sharing"
              className="p-1 rounded-md text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-rose-500" />
            </button>
          </div>
        </div>

        {/* Video Canvas Body */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative bg-black/60 aspect-video overflow-hidden flex items-center justify-center"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain pointer-events-none"
              />

              {/* Scanning Holographic Line Overlay when Analyzing */}
              {isAnalyzing && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <motion.div
                    className="w-full h-1 shadow-lg"
                    style={{
                      backgroundColor: currentTheme.primary,
                      boxShadow: `0 0 12px ${currentTheme.glow}`,
                    }}
                    animate={{ y: [0, 160, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent"
                    style={{
                      backgroundImage: `linear-gradient(to bottom, transparent, ${currentTheme.surface}, transparent)`,
                    }}
                  />
                </div>
              )}

              {/* Subtle Scanlines overlay for futuristic feel */}
              <div
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.4) 2px, rgba(0, 0, 0, 0.4) 4px)',
                }}
              />

              {/* Holographic Analyzing Badge */}
              {isAnalyzing && (
                <div
                  className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold flex items-center gap-1 backdrop-blur-md border shadow-md animate-pulse"
                  style={{
                    backgroundColor: currentTheme.surface,
                    borderColor: currentTheme.border,
                    color: currentTheme.accent,
                  }}
                >
                  <Sparkles className="w-2.5 h-2.5 animate-spin" />
                  <span>ANALYZING SCREEN</span>
                </div>
              )}

              {/* Target info badge */}
              {sourceLabel && !isAnalyzing && (
                <div className="absolute bottom-2 left-2 max-w-[85%] truncate px-2 py-0.5 rounded-md text-[9px] font-mono text-slate-400 bg-black/70 backdrop-blur-sm border border-white/5">
                  {sourceLabel}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info & Action strip */}
        <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-emerald-400" />
            <span>AIRA Vision Online</span>
          </div>

          <button
            type="button"
            onClick={onStop}
            className="text-rose-400 hover:text-rose-300 font-sans text-[11px] font-medium transition-colors cursor-pointer"
          >
            Stop Sharing
          </button>
        </div>
      </div>
    </motion.div>
  );
};
